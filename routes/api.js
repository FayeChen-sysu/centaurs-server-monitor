/**
 * @file centaurs-server-monitor: API routes
 * @copyright Centaurs Technologies Co. 2017
 * @author Feliciano.Long & Zhang, Yuancheng
 * @license Unlicense
 * @module routes/api
 */

var express = require('express'),
	router = express.Router(),
	LogService = require('../services/log'),
	os = require('os'),
	util = require('util'),
	config = require('config'),
	app_list = [],
	app_api_time = {},
	app_check_time_list = {},	// app_name : next_time
	app_check_interval = 3 * 1000,			// 1 sec dev default 
	time_interval_limit = 30 * 1000;		// 10 sec dev default

var EmailClient = require('../services/email'),
	mode = process.env.NODE_ENV,
	emailClient = new EmailClient(mode);

var updateApplistCache,
	loadAppList,
	loadApiTime,
	sysCheckTime;

updateApplistCache = (next) => {
	LogService.getApplist((err, list) => {
		if (err) {
			console.log(`[MongoDB][ERR][getApplist] ${err}`);
		} else {
			for (var i = 0; i < list.length; ++i) {
				app_list[i] = list[i].name;
			}
			console.log(`[Cache][MSG] app_list is ${JSON.stringify(app_list)}`);
			if (next) {
				next();
			}
		}
	});
}

// initialize
(() => {
	// init config
	if (config.has('app_check_interval')) {
		app_check_interval = config.get('app_check_interval');
	}
	if (config.has('time_interval_limit')) {
		time_interval_limit = config.get('time_interval_limit');
	}
	console.log(`[config] app_check_interval is ${app_check_interval}`);
	console.log(`[config] time_interval_limit is ${time_interval_limit}`);

	// init app statuses
	updateApplistCache(() => {
		// make every app status offline
		app_list.forEach((app_name) => {
			LogService.updateApplist(
				{
					name: app_name,
					status: 'offline'
				}, (err) => {
					if (err) {
						console.log(`[MongoDB][ERR][updateApplist] ${err}`);
					}
				}
			);
			console.log(`[Init][MSG] init ${app_name} offline`);
		});
	});
})();

checkAppStatus = () => {
	var now = Date.now();
	updateApplistCache();
	for (const app_name in app_check_time_list) {
		if (app_name && now - app_check_time_list[app_name] > time_interval_limit) {
			var time = new Date(app_check_time_list[app_name]);
			console.log(`[Send][Alert][Email] ${app_name} is offline at ${time.toString()}(${app_check_time_list[app_name]})`);
			emailClient.emailLog(`[API Server Error] ${app_name}`, `${app_name} is offline at ${time.toString()}`);
			delete app_check_time_list[app_name];
			LogService.updateApplist({
				name: app_name,
				status: 'offline'
			}, (err) => {
				console.log(`[MongoDB][ERR][updateApplist] ${err}`);
			})
		}
	}
};

// load api time 
(loadApiTime = () => {
	console.log(`[Cache][MSG] app_api_time is ${JSON.stringify(app_api_time)}`);
	var limit = 1;
	updateApplistCache(() => {
		app_list.forEach((app_name) => {
			if (!app_api_time[app_name]) {
				app_api_time[app_name] = {};
			}
			LogService.getApp(app_name, (err, app) => {
				if (err) {
					console.log(`[MongoDB][ERR][getApp] ${err}`);
				} else {
					var paths = app.apis;
					if (paths) {
						paths.forEach((path) => {
							LogService.getApiUsageLog(app_name, path, limit, (err, api) => {
								if (err) {
									console.log(`[MongoDB][ERR][getApiUsageLog] ${err}`);
								} else {
									if (api.length > 0) {
										var api_path = api[0].api_path;
										if (!app_api_time[app_name][api_path]) {
											app_api_time[app_name][api_path] = [];
										}
										for (var i = 0; i < api.length; i++) {
											app_api_time[app_name][api_path].push(api[i].time);
										}
									}
								}
							});
						});
					}
				}
			});
		});
	});
})();

(sysCheckTime = (app_check_interval) => {
	setInterval(checkAppStatus, app_check_interval);
	setInterval(loadApiTime, app_check_interval);
});

// only for demo
router.get('/server', function (req, res) {
	var memUsage = util.inspect(process.memoryUsage()) + ''

	var memStrs = memUsage.split(',')

	var info = {}

	var str = memStrs[0];
	info.srv_alc = (parseInt(str.substring(str.indexOf(":") + 1)) / 1024).toFixed()
	info.srv_free = (info.srv_alc - parseInt(memStrs[2].substring(memStrs[2].indexOf(':') + 1)) / 1024).toFixed()

	info.sys_free = (os.freemem() / 1024).toFixed()
	info.sys_sum = (os.totalmem() / 1024).toFixed()

	var origin = req.headers.host;
	res.header('Access-Control-Allow-Origin', '*');	
	res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Content-Type', 'application/json;charset=UTF-8');

	res.send(JSON.stringify(info))
})

router.get('/applist', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');	
	res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Content-Type', 'application/json;charset=UTF-8');
	var res_obj = {};
	if (app_list.length < 1) {
		res_obj.retcode = 2;
		res_obj.msg = "app list is empty"
		res.send(JSON.stringify(res_obj));
	} else {
		LogService.getApplist((err, list) => {
			if (err) {
				console.log(`[MongoDB][ERR][getApplist] ${err}`);
				res_obj.retcode = 1;
				res_obj.msg = `database err ${err}`;
			} else {
				res_obj.retcode = 0;
				res_obj.msg = "success";
				res_obj.data = list;
			}
			res.send(JSON.stringify(res_obj));
		});
	}
})

router.get('/server-info', (req, res) => {
	var res_obj = {},
		app_name = req.query.app_name,
		limit = req.query.limit * 1 || 10;
	var origin = req.headers.host;
	res.header('Access-Control-Allow-Origin', '*');	
	res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Content-Type', 'application/json;charset=UTF-8');
	if (!app_name) {
		res_obj.retcode = 2;
		res_obj.msg = "no app name"
		res.send(JSON.stringify(res_obj));
	} else {
		if (app_list.length < 1) {
			res_obj.retcode = 4;
			res_obj.msg = "app list is empty"
			res.send(JSON.stringify(res_obj));
		} else {

			try {
				LogService.getSysLog(app_name, limit, (err, logs) => {
					var data = []
					if (err) {
						console.log(`[MongoDB][ERR][getSysLog] ${err}`);
					} else {
						for (var i = 0; i < logs.length; i++) {
							var tmp = {};
							tmp.time = logs[i].createdAt;
							tmp.srv_alc = logs[i].srv_alc;
							tmp.srv_free = logs[i].srv_free;
							tmp.sys_free = logs[i].sys_free;
							tmp.sys_sum = logs[i].sys_sum;
							data.push(tmp);
						}
						res_obj.retcode = 0;
						res_obj.msg = "success";
						res_obj.data = data;
						res.send(JSON.stringify(res_obj));
					}
				});
			} catch (err) {
				console.error(err);
				res_obj = {};
				res_obj.retcode = 1;
				res_obj.msg = "request error"
				res.send(JSON.stringify(res_obj));
			}
		}
	}
});

router.get('/api-time', (req, res) => {
	var res_obj = {},
		app_name = req.query.app_name,
		limit = req.query.limit * 1 || 1;
	var origin = req.headers.host;
	res.header('Access-Control-Allow-Origin', '*');	
	res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Content-Type', 'application/json;charset=UTF-8');

	if (!app_name) {
		res_obj.retcode = 2;
		res_obj.msg = "no app name"
		res.send(JSON.stringify(res_obj));
	} else if (!app_api_time[app_name] || Object.keys(app_api_time[app_name]).length === 0) {
		res_obj.retcode = 1;
		res_obj.msg = "no api path";
		res.send(JSON.stringify(res_obj));
	} else {
		res_obj.retcode = 0;
		res_obj.msg = "success";
		res_obj.data = app_api_time[app_name];
		res.send(JSON.stringify(res_obj));
	}
});

router.get('/test-info', (req, res) => {
	var res_obj = {},
		app_name = req.query.app_name,
		limit = req.query.limit * 1 || 5;
	var origin = req.headers.host;
	res.header('Access-Control-Allow-Origin', '*');	
	res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Content-Type', 'application/json;charset=UTF-8');
	if (!app_name) {
		res_obj.retcode = 2;
		res_obj.msg = "no app name"
		res.send(JSON.stringify(res_obj));
	} else {
		try {
			LogService.getSysLog(app_name, limit, (err, logs) => {
				var data = []
				if (err) {
					console.log(`[MongoDB][ERR][getSysLog] ${err}`);
				} else {
					LogService.getTestLog(app_name, limit, (err, logs) => {
						if (err) {
							console.log(`[MongoDB][ERR][getTestLog] ${err}`);
						} else {
							for (var i = 0; i < logs.length; i++) {
								if (logs[i]) {
									var tmp = {};
									tmp.time = logs[i].createdAt;
									tmp.msg = logs[i].msg;
									data.push(tmp);
								} else {
									break;
								}
							}
							res_obj.retcode = 0;
							res_obj.msg = "success";
							res_obj.data = data;
							res.send(JSON.stringify(res_obj));
						}
					});
				}
			});
		} catch (err) {
			console.error(err);
			res_obj = {};
			res_obj.retcode = 1;
			res_obj.msg = "request error"
			res.send(JSON.stringify(res_obj));
		}
	}
});

router.get('/catch-err', (req, res) => {
	var res_obj = {},
		app_name = req.query.app_name,
		limit = req.query.limit * 1 || 5;
	var origin = req.headers.host;
	res.header('Access-Control-Allow-Origin', '*');	
	res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Content-Type', 'application/json;charset=UTF-8');
	if (!app_name) {
		res_obj.retcode = 2;
		res_obj.msg = "no app name"
		res.send(JSON.stringify(res_obj));
	} else {
		try {
			var data = [];
			LogService.getErrLog(app_name, limit, (err, logs) => {
				if (err) {
					console.log(`[MongoDB][ERR][getErrLog] ${err}`);
				} else {
					for (var i = 0; i < logs.length; i++) {
						if (logs[i]) {
							var tmp = {};
							tmp.time = logs[i].createdAt;
							tmp.err = logs[i].err;
							data.push(tmp);
						} else {
							break;
						}
					}
					res_obj.retcode = 0;
					res_obj.msg = "success";
					res_obj.data = data;
					res.send(JSON.stringify(res_obj));
				}
			});
		} catch (err) {
			console.error(err);
			res_obj = {};
			res_obj.retcode = 1;
			res_obj.msg = "request error"
			res.send(JSON.stringify(res_obj));
		}
	}
});

router.get('/api-path', (req, res) => {
	var res_obj = {},
		app_name = req.query.app_name;
	var origin = req.headers.host;
	res.header('Access-Control-Allow-Origin', '*');	
	res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Content-Type', 'application/json;charset=UTF-8');
	if (!app_name) {
		res_obj.retcode = 2;
		res_obj.msg = "no app name"
		res.send(JSON.stringify(res_obj));
	} else {
		LogService.getApp(app_name, (err, app) => {
			if (err) {
				console.log(`[MongoDB][ERR][getApplist] ${err}`);
			} else {
				if (app.apis) {
					res_obj.retcode = 0;
					res_obj.msg = "success";
					res_obj.data = app.apis;
					res.send(JSON.stringify(res_obj));
				} else {
					res_obj.retcode = 1;
					res_obj.msg = "no api path timed"
					res.send(JSON.stringify(res_obj));
				}
			}
		});
	}
})

router.post('/server-info', function (req, res, err) {
	try {
		if (!req.body) {
			return res.sendStatus(400);
		}
		var info = req.body;
		console.log(`[Receive][Sys] ${JSON.stringify(info)}`);
		LogService.updateApplist(
			{
				name: info.app_name,
				status: 'running'
			}, (err) => {
				if (err) {
					console.log(`[MongoDB][ERR][updateApplist] ${err}`);
				} else {
					updateApplistCache();
				}
			}
		);
		LogService.addSysLog(info, (err) => {
			app_check_time_list[info.app_name] = info.next_time;
			var res_obj = {};
			if (err) {
				console.log(`[MongoDB][ERR][addSysLog] ${err}`);
			} else {
				res_obj.retcode = 0;
				res_obj.msg = "success";
				res.send(JSON.stringify(res_obj));
			}
		});

	} catch (err) {
		console.error(err);
		var res_obj = {};
		res_obj.retcode = 1;
		res_obj.msg = "request error"
		res.send(JSON.stringify(res_obj));
	}
});

router.post('/test-info', function (req, res, err) {
	try {
		if (!req.body) {
			return res.sendStatus(400);
		}
		var info = req.body;
		console.log(`[Receive][Test] ${JSON.stringify(info)}`);
		LogService.updateApplist(
			{
				name: info.app_name,
				status: 'running'
			}, (err) => {
				if (err) {
					console.log(`[MongoDB][ERR][updateApplist] ${err}`);
				} else {
					updateApplistCache();
				}
			}
		);
		LogService.addTestLog(info, (err) => {
			var res_obj = {};
			if (err) {
				console.log(`[MongoDB][ERR][addTestLog] ${err}`);
			} else {
				res_obj.retcode = 0;
				res_obj.msg = "success";
				res.send(JSON.stringify(res_obj));
			}
		})
	} catch (err) {
		console.error(err);
		var res_obj = {};
		res_obj.retcode = 1;
		res_obj.msg = "request error"
		res.send(JSON.stringify(res_obj));
	}
});

router.post('/catch-err', function (req, res, err) {
	try {
		if (!req.body) {
			return res.sendStatus(400);
		}
		var info = req.body;
		console.log(`[Receive][Err] ${JSON.stringify(info)}`);
		LogService.updateApplist(
			{
				name: info.app_name,
				status: 'running'
			}, (err) => {
				if (err) {
					console.log(`[MongoDB][ERR][updateApplist] ${err}`);
				} else {
					updateApplistCache();
				}
			}
		);
		LogService.addErrLog(info, (err) => {
			var res_obj = {};
			if (err) {
				console.log(`[MongoDB][ERR][addErrLog] ${err}`);
			} else {
				res_obj.retcode = 0;
				res_obj.msg = "success";
				res.send(JSON.stringify(res_obj));
			}
		});
	} catch (err) {
		console.error(err);
		var res_obj = {};
		res_obj.retcode = 1;
		res_obj.msg = "request error"
		res.send(JSON.stringify(res_obj));
	}
});

router.post('/api-time', function (req, res, err) {
	try {
		if (!req.body) {
			return res.sendStatus(400);
		}
		var info = req.body;
		console.log(`[Receive][Time] ${JSON.stringify(info)}`);
		var api_list = [];
		LogService.getApp(info.app_name, (err, app) => {
			if (err) {
				console.log(`[MongoDB][ERR][getApplist] ${err}`);
			} else {
				if (app.apis) {
					api_list = app.apis;
				}
				if (api_list.indexOf(info.api_path) < 0) {
					api_list.push(info.api_path);
				}
				LogService.updateApplist(
					{
						name: info.app_name,
						status: 'running',
						apis: api_list
					}, (err) => {
						if (err) {
							console.log(`[MongoDB][ERR][updateApplist] ${err}`);
						} else {
							updateApplistCache();
						}
					}
				);
			}
		});
		LogService.addUsageLog(info, (err) => {
			var res_obj = {};
			if (err) {
				console.log(`[MongoDB][ERR][addUsageLog] ${err}`);
			} else {
				res_obj.retcode = 0;
				res_obj.msg = "success";
				res.send(JSON.stringify(res_obj));
			}
		})
	} catch (err) {
		console.error(err);
		var res_obj = {};
		res_obj.retcode = 1;
		res_obj.msg = "request error"
		res.send(JSON.stringify(res_obj));
	}
});

module.exports = router;
