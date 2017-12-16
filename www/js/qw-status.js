// var host = '47.88.77.157',
var host = 'localhost',
	port = '10021';

function updateSysChart(app_name, chart_data) {
	var ctxL = document.getElementById(`${app_name}-sys-mem`).getContext('2d');
	var myLineChart = new Chart(ctxL, {
		type: 'line',
		data: {
			labels: chart_data.labels,
			datasets: [
				{
					label: 'Free',
					backgroundColor: 'rgba(151,205,169,0.2)',
					borderWidth: 2,
					borderColor: 'rgba(151,205,169,1)',
					pointBackgroundColor: 'rgba(151,205,169,1)',
					pointBorderColor: '#fff',
					pointBorderWidth: 1,
					pointRadius: 4,
					pointHoverBackgroundColor: '#fff',
					pointHoverBorderColor: 'rgba(151,205,169,1)',
					data: chart_data.sys_free
				},
				{
					label: 'Used',
					backgroundColor: 'rgba(205,151,187,0.2)',
					borderWidth: 2,
					borderColor: 'rgba(205,151,187,1)',
					pointBackgroundColor: 'rgba(205,151,187,1)',
					pointBorderColor: '#fff',
					pointBorderWidth: 1,
					pointRadius: 4,
					pointHoverBackgroundColor: '#fff',
					pointHoverBorderColor: 'rgba(205,151,187,1)',
					data: chart_data.sys_used
				},
				{
					label: 'Total',
					backgroundColor: 'rgba(220,220,220,0.2)',
					borderWidth: 2,
					borderColor: 'rgba(220,220,220,1)',
					pointBackgroundColor: 'rgba(220,220,220,1)',
					pointBorderColor: '#fff',
					pointBorderWidth: 1,
					pointRadius: 4,
					pointHoverBackgroundColor: '#fff',
					pointHoverBorderColor: 'rgba(220,220,220,1)',
					data: chart_data.sys_sum
				}
			]
		},
		options: {
			responsive: true
		}
	});
};

function updateSrvChart(app_name, chart_data) {
	var ctxL = document.getElementById(`${app_name}-srv-mem`).getContext('2d');
	var myLineChart = new Chart(ctxL, {
		type: 'line',
		data: {
			labels: chart_data.labels,
			datasets: [
				{
					label: 'Free',
					backgroundColor: 'rgba(187,205,151,0.2)',
					borderWidth: 2,
					borderColor: 'rgba(187,205,151,1)',
					pointBackgroundColor: 'rgba(187,205,151,1)',
					pointBorderColor: '#fff',
					pointBorderWidth: 1,
					pointRadius: 4,
					pointHoverBackgroundColor: '#fff',
					pointHoverBorderColor: 'rgba(187,205,151,1)',
					data: chart_data.srv_free
				},
				{
					label: 'Used',
					backgroundColor: 'rgba(169,151,205,0.2)',
					borderWidth: 2,
					borderColor: 'rgba(169,151,205,1)',
					pointBackgroundColor: 'rgba(169,151,205,1)',
					pointBorderColor: '#fff',
					pointBorderWidth: 1,
					pointRadius: 4,
					pointHoverBackgroundColor: '#fff',
					pointHoverBorderColor: 'rgba(169,151,205,1)',
					data: chart_data.srv_used
				},
				{
					label: 'Allocated',
					backgroundColor: 'rgba(220,220,220,0.2)',
					borderWidth: 2,
					borderColor: 'rgba(220,220,220,1)',
					pointBackgroundColor: 'rgba(220,220,220,1)',
					pointBorderColor: '#fff',
					pointBorderWidth: 1,
					pointRadius: 4,
					pointHoverBackgroundColor: '#fff',
					pointHoverBorderColor: 'rgba(220,220,220,1)',
					data: chart_data.srv_alc
				}
			]
		},
		options: {
			responsive: true
		}
	});
};

function updateSysTable(app_name, data) {
	var sum = document.getElementById(`${app_name}-sys-sum`),
		used = document.getElementById(`${app_name}-sys-used`),
		free = document.getElementById(`${app_name}-sys-free`),
		percent = document.getElementById(`${app_name}-sys-percent`);
	sum.innerHTML=data.sys_sum + ' MB';
	used.innerHTML=data.sys_used + ' MB';
	free.innerHTML=data.sys_free + ' MB';
	percent.innerHTML=data.sys_percent + ' %';
}

function updateSrvTable(app_name, data) {
	var sum = document.getElementById(`${app_name}-srv-sum`),
		used = document.getElementById(`${app_name}-srv-used`),
		free = document.getElementById(`${app_name}-srv-free`),
		percent = document.getElementById(`${app_name}-srv-percent`);
	sum.innerHTML=data.srv_sum + ' MB';
	used.innerHTML=data.srv_used + ' MB';
	free.innerHTML=data.srv_free + ' MB';
	percent.innerHTML=data.srv_percent + ' %';
}

String.prototype.temp = function (obj) {
	return this.replace(/\$\w+\$/gi, function (matches) {
		var ret = obj[matches.replace(/\$/g, '')];
		if (ret === '') {
			ret = 'N/A';
		}
		return (ret + "") === "undefined" ? matches : ret;
	});
}

var applist = [];

function reqAppList() {
	$.ajax({
		url: `http://${host}:${port}/api/gm/applist`,
		type: 'GET',
		success: loadAppList,
		error: function () { }
	});
}

function loadAppList(obj) {
	if (obj && obj.retcode == 0) {
		applist = obj.data;
		console.log(applist);

		for (var i = 0; i < applist.length; i++) {
			var tempInfoHtml = $('#info-temp').html();
			var resObj = {},
				app_name = applist[i].name;
			resObj.app_name = app_name;
			resObj.app_status = applist[i].status;
			var resHtml = tempInfoHtml.temp(resObj),
				myElem = document.getElementById(app_name);
			if (myElem === null) {
				$("#info").append(`<div id='${app_name}'>${resHtml}</div>`);
			} else {
				myElem.innerHTML = resHtml;
			}
		}
	}
}

function reqSysData(app_name, limit) {
	if (!limit) {
		limit = 20;
	}
	$.ajax({
		url: `http://${host}:${port}/api/gm/server-info/?app_name=${app_name}&limit=${limit}`,
		type: 'GET',
		success: (obj) => {
			loadSysData(app_name, obj);
		},
		error: (err) => {
			console.log(`request ${app_name} data failed`)
		}
	});
}

function loadSysData(app_name, obj) {
	if (obj && obj.retcode == 0) {
		var data = obj.data,
			chart_data = {},
			time, sys_sum, sys_free, srv_alc, srv_free;

		chart_data.labels = [];

		chart_data.sys_sum = [];
		chart_data.sys_free = [];
		chart_data.sys_used = [];

		chart_data.srv_alc = [];
		chart_data.srv_free = [];
		chart_data.srv_used = [];

		for (var i = 0; i < data.length; ++i) {
			time = /\d\d:\d\d/.exec(data[i].time)[0];
			sys_sum = data[i].sys_sum / 1000 || 0;
			sys_free = data[i].sys_free / 1000 || 0;
			srv_alc = data[i].srv_alc / 1000 || 0;
			srv_free = data[i].srv_free / 1000 || 0;

			chart_data.labels.push(time);

			chart_data.sys_sum.push(sys_sum);
			chart_data.sys_free.push(sys_free);
			chart_data.sys_used.push(sys_sum - sys_free);

			chart_data.srv_alc.push(srv_alc);
			chart_data.srv_free.push(srv_free);
			chart_data.srv_used.push(srv_alc - srv_free);
		}

		chart_data.labels.reverse();
		chart_data.sys_free.reverse();
		chart_data.sys_used.reverse();
		chart_data.sys_sum.reverse();
		chart_data.srv_alc.reverse();
		chart_data.srv_free.reverse();

		updateSysTable(app_name, {
			sys_sum: Math.round(sys_sum),
			sys_used: Math.round(sys_sum - sys_free),
			sys_free: Math.round(sys_free),
			sys_percent: Math.round(10000 - sys_free / sys_sum * 10000) / 100
		})

		updateSrvTable(app_name, {
			srv_sum: Math.round(srv_alc),
			srv_used: Math.round(srv_alc - srv_free),
			srv_free: Math.round(srv_free),
			srv_percent: Math.round(10000 - srv_free / srv_alc * 10000) / 100
		})
		updateSysChart(app_name, chart_data);
		updateSrvChart(app_name, chart_data);
	} else {
		console.log(obj);
	}
}

function reqTestData(app_name, limit) {
	if (!limit) {
		limit = 20;
	}
	$.ajax({
		url: `http://${host}:${port}/api/gm/test-info/?app_name=${app_name}&limit=${limit}`,
		type: 'GET',
		success: function (obj) {
			// loadAppData(app_name, data);
			console.log(obj)
		},
		error: function () { }
	});
}

function reqErrData(app_name, limit) {
	if (!limit) {
		limit = 1000;
	}
	$.ajax({
		url: `http://${host}:${port}/api/gm/catch-err/?app_name=${app_name}&limit=${limit}`,
		type: 'GET',
		success: function (obj) {
			// loadAppData(app_name, data);
			console.log(obj)
		},
		error: function () { }
	});
}

reqAppList();
// setInterval(reqAppList, 5000);

reqSysData('joke-api');
reqErrData('joke-api');