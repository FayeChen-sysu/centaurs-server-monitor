$().ready(() => {

	var host = '47.88.77.157',
		// var host = 'localhost',
		port = '10021',
		app_list = [],
		err_list = [],
		app_err_cnt = 0,
		index = 0;

	function updateApiChart(app_name, chart_data) {
		var ctxB = document.getElementById(`${app_name}-api-time-chart`).getContext('2d'),
			color_bg_enum = [
				'rgba(255, 99, 132, 0.2)',
				'rgba(54, 162, 235, 0.2)',
				'rgba(255, 206, 86, 0.2)',
				'rgba(75, 192, 192, 0.2)',
				'rgba(153, 102, 255, 0.2)',
				'rgba(255, 159, 64, 0.2)'
			],
			color_bd_enum = [
				'rgba(255,99,132,1)',
				'rgba(54, 162, 235, 1)',
				'rgba(255, 206, 86, 1)',
				'rgba(75, 192, 192, 1)',
				'rgba(153, 102, 255, 1)',
				'rgba(255, 159, 64, 1)'
			],
			color_bg = [],
			color_bd = [];

		for (var i = 0; i < chart_data.labels.length; i++) {
			color_bg.push(color_bg_enum[i % 6]);
			color_bd.push(color_bd_enum[i % 6]);
		}

		var myBarChart = new Chart(ctxB, {
			type: 'bar',
			data: {
				labels: chart_data.labels,
				datasets: [{
					label: 'Time of Api Request (ms)',
					data: chart_data.data,
					backgroundColor: color_bg,
					borderColor: color_bd,
					borderWidth: 1
				}]
			},
			options: {
				animation: false,
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true,
							stepSize: 1,
						}
					}]
				}
			}
		});
	};

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
				responsive: true,
				animation: false
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
				responsive: true,
				animation: false
			}
		});
	};

	function updateSysTable(app_name, data) {
		var sum = document.getElementById(`${app_name}-sys-sum`),
			used = document.getElementById(`${app_name}-sys-used`),
			free = document.getElementById(`${app_name}-sys-free`),
			percent = document.getElementById(`${app_name}-sys-percent`);
		sum.innerHTML = data.sys_sum + ' MB';
		used.innerHTML = data.sys_used + ' MB';
		free.innerHTML = data.sys_free + ' MB';
		percent.innerHTML = data.sys_percent + ' %';
	}

	function updateSrvTable(app_name, data) {
		var sum = document.getElementById(`${app_name}-srv-sum`),
			used = document.getElementById(`${app_name}-srv-used`),
			free = document.getElementById(`${app_name}-srv-free`),
			percent = document.getElementById(`${app_name}-srv-percent`);
		sum.innerHTML = data.srv_sum + ' MB';
		used.innerHTML = data.srv_used + ' MB';
		free.innerHTML = data.srv_free + ' MB';
		percent.innerHTML = data.srv_percent + ' %';
	}

	function updateSummaryStatusChart(data) {
		//pie
		var ctxP = document.getElementById("dashboard-status-chart").getContext('2d');
		var myPieChart = new Chart(ctxP, {
			type: 'pie',
			data: {
				labels: ["Idle", "Running"],
				datasets: [
					{
						data: data,
						backgroundColor: ["#F7464A", "#46BFBD"],
						hoverBackgroundColor: ["#FF5A5E", "#5AD3D1"]
					}
				]
			},
			options: {
				responsive: true
			}
		});
	}

	function updateStatus(app_name, status) {
		id = `#${app_name}-status`;
		$(id).removeClass('red green');
		if (status == 'running') {
			$(id).addClass('green')
		} else {
			$(id).addClass('red');
		}
		$(id).html(status);
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

	function updateAllApp() {
		app_list.forEach((app) => {
			var app_name = app.name,
				status = app.status;
			updateStatus(app_name, status);
			reqSysData(app_name);
			reqErrData(app_name, 5, loadErrData);
			reqTestData(app_name);
			// reqApiPath(app_name);
			reqApiTime(app_name);
		});
	}

	function reqAppList() {
		$.ajax({
			url: `http://${host}:${port}/api/gm/applist`,
			type: 'GET',
			success: loadAppList,
			error: function (err) {
				console.log(`[ERR] request app list failed. ${JSON.stringify(err)}`);
			}
		});
	}

	function loadAppList(obj) {
		if (obj && obj.retcode === 0) {
			if (obj.data) {
				app_list = obj.data;
			}
			for (var i = 0; i < app_list.length; i++) {
				var tempInfoHtml = $('#info-temp').html();
				var resObj = {},
					app_name = app_list[i].name,
					status = app_list[i].status;
				resObj.app_name = app_name;
				resObj.app_status = status;
				var resHtml = tempInfoHtml.temp(resObj),
					myElem = document.getElementById(app_name);
				if (myElem === null) {
					$("#info").append(`<div id='${app_name}' class='app-item'>${resHtml}</div>`);
					$("#navbar-app-list-items").append(`<span class="dropdown-item" id="nav-${app_name}" idx="${i + 1}">${app_name}</span>`)
				}
			}
			showDashboard();
			initEventListener();
			loadSummaryAppList();
			reqErrList();
		} else {
			console.log(`[ERR] load app list failed. ${JSON.stringify(obj)}`);
		}
	}

	function loadSummaryAppList() {
		var total = app_list.length,
			idle = 0;
		for (var i = 0; i < total; i++) {
			$('#dashboard-status-table').append(
				`<tr>
				<th scope="row">${i + 1}</th>
				<td>${app_list[i].name}</td>
				<td>${app_list[i].status}</td>
				</tr>`);

			if (app_list[i].status != 'running') {
				idle++;
			}
		}
		updateSummary(total, idle);
		updateSummaryStatusChart([idle, total - idle])
	}

	function updateSummary(total, idle) {
		$('#dashboard-app-total').html(total);
		$('#dashboard-app-running').html(total - idle);
		$('#dashboard-app-idle').html(idle);
		$('#dashboard-app-operation-rate').html(Math.round(10000 - idle / total * 10000) / 100 + '%');
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
				console.log(`[ERR] request ${app_name} data failed. ${JSON.stringify(err)}`)
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
			console.log(`[ERR] load ${app_name} system data failed. ${JSON.stringify(obj)}`);
		}
	}

	function reqApiTime(app_name, limit) {
		if (!app_name) {
			return;
		}
		if (!limit) {
			limit = 1;
		}
		$.ajax({
			url: `http://${host}:${port}/api/gm/api-time/?app_name=${app_name}&limit=${limit}`,
			type: 'GET',
			success: (obj) => {
				loadApiTime(app_name, obj);
			},
			error: (err) => {
				console.log(`[ERR] request ${app_name} api time failed. ${JSON.stringify(err)}`);
			}
		});
	}

	function loadApiTime(app_name, obj) {
		var id = `#${app_name}-api-time-chart`
		id_r = `#${app_name}-api-paths`,
			i = 1;
		if (obj && obj.retcode == 0) {
			var data = obj.data,
				chart_data = {};

			chart_data.labels = [];
			chart_data.data = [];
			$(id).removeClass('collapse');
			$(id_r).html('');
			for (const prop in data) {
				$(id_r).append(
					`<tr>
					<th scope="row">${i}</th>
					<td>${prop}</td>
					<td>${data[prop][0]}</td>
					</tr>`);
				i++;
				if (data[prop][0]) {
					var label = prop.split('?')[0];
					chart_data.labels.push(label);
					chart_data.data.push(data[prop][0]);
				}
			}
			if (chart_data.labels.length > 0) {
				updateApiChart(app_name, {
					labels: chart_data.labels,
					data: chart_data.data
				});
			} else {
				$(id).addClass('collapse');
			}

		} else {
			$(id).addClass('collapse');
			console.log(`[ERR] load ${app_name} api time failed. ${JSON.stringify(obj)}`);
		}
	}

	function reqTestData(app_name, limit) {
		if (!limit) {
			limit = 5;
		}
		$.ajax({
			url: `http://${host}:${port}/api/gm/test-info/?app_name=${app_name}&limit=${limit}`,
			type: 'GET',
			success: function (obj) {
				loadTestData(app_name, obj);
			},
			error: function (err) {
				console.log(`[ERR] request ${app_name} test data failed. ${JSON.stringify(err)}`);
			}
		});
	}

	function loadTestData(app_name, obj) {
		var table_id = `#${app_name}-test-table`;
		if (obj.retcode == 0) {
			var data = obj.data;
			$(table_id).html('');
			for (var i = 0; i < data.length; i++) {
				var date = data[i].time.split('T')[0],
					time = data[i].time.split('T')[1].split('.')[0],
					test_res = data[i].msg,
					test_html =
						`<tr>
			        <th scope="row">${i + 1}</th>
			        <td>${date}</td>
			        <td>${time}</td>
			        <td>${test_res}</td>
			        </tr>`;
				$(table_id).append(test_html);
			}
		} else {
			console.log(`[ERR] load ${app_name} test records failed. ${JSON.stringify(obj)}`)
		}
	}

	function reqErrData(app_name, limit, callback) {
		if (!limit) {
			limit = 5;
		}
		$.ajax({
			url: `http://${host}:${port}/api/gm/catch-err/?app_name=${app_name}&limit=${limit}`,
			type: 'GET',
			success: function (obj) {
				if (callback) {
					callback(app_name, obj);
				} else {
					console.log(`[ERR] request ${app_name} err data succuss, but no callback function.`);
				}
			},
			error: function (err) {
				console.log(`[ERR] request ${app_name} err data failed. ${JSON.stringify(err)}`);
			}
		});
	}

	function loadErrData(app_name, obj) {
		var table_id = `#${app_name}-error-table`;
		if (obj.retcode == 0) {
			var data = obj.data;
			if (data && data.length > 0) {
				$(table_id).html('');
				var index = 1,
					prev_err = '';
				for (var i = 0; i < data.length; i++) {
					var date = data[i].time.split('T')[0],
						time = data[i].time.split('T')[1].split('.')[0],
						err = data[i].err;
					if (prev_err != err) {
						var err_fmt = err.replace(/\n/g, '<br>');
						var err_html =
							`<tr>
						<th scope="row">${index}</th>
						<td>${date}</td>
						<td>${time}</td>
						<td>${err_fmt}</td>
						</tr>`;
						$(table_id).append(err_html);
						index++;
						prev_err = err;
					}
				}
			} else {
				console.log(`[MSG] ${app_name} has no error record.`);
			}
		} else {
			console.log(`[ERR] load ${app_name} error records failed. ${JSON.stringify(obj)}`)
		}
	}


	function reqErrList() {
		err_list = [];
		app_err_cnt = 0;
		for (var i = 0; i < app_list.length; i++) {
			reqErrData(app_list[i].name, 1, loadErrList);
		}
	}

	function loadErrList(app_name, obj) {
		app_err_cnt++;
		var table_id = '#dashboard-error-table';
		if (obj.retcode == 0) {
			var data = obj.data;
			if (data && data.length > 0) {

				var date = data[0].time.split('T')[0],
					time = data[0].time.split('T')[1].split('.')[0],
					err = data[0].err;

				var err_fmt = err.replace(/\n/g, '<br>');
				var err_obj = {
					app_name: app_name,
					date: date,
					time: time,
					err_fmt: err_fmt
				};
				err_list.push(err_obj);
			} else {
				console.log(`[MSG] ${app_name} has no error record.`);
			}
		} else {
			console.log(`[ERR] load ${app_name} error records failed. ${JSON.stringify(obj)}`)
		}
		if (app_err_cnt === app_list.length) {
			showErrList();
		}
	}

	function showErrList() {
		var table_id = '#dashboard-error-table';
		$(table_id).html('');
		for (var i = 0; i < err_list.length; i++) {
			var err_html =
				`<tr>
				<th scope="row">${i + 1}</th>
				<td>${err_list[i].app_name}</td>
				<td>${err_list[i].date}</td>
				<td>${err_list[i].time}</td>
				<td>${err_list[i].err_fmt}</td>
				</tr>`;
			$(table_id).append(err_html);
		}
	}

	function reqApiPath(app_name) {
		if (!app_name) {
			return;
		}
		$.ajax({
			url: `http://${host}:${port}/api/gm/api-path/?app_name=${app_name}`,
			type: 'GET',
			success: function (obj) {
				loadApiPath(app_name, obj);
			},
			error: function (err) {
				console.log(`[ERR] request ${app_name} api path failed. ${JSON.stringify(err)}`);
			}
		});
	}

	function loadApiPath(app_name, obj) {
		var id = `#${app_name}-api-time`,
			id_r = `#${app_name}-api-paths`;
		if (typeof (obj) != 'object') {
			obj = JSON.parse(obj);
		}
		if (obj.retcode == 0) {
			var paths = obj.data;
			if (paths && paths.length > 0) {
				$(id).removeClass('collapse');
				$(id_r).html('');
				for (var i = 0; i < paths.length; i++) {
					$(id_r).append(
						`<tr>
						<th scope="row">${i + 1}</th>
						<td>${paths[i]}</td>
						</tr>`);
				}
			} else {
				$(id).addClass('collapse');
			}
		} else {
			console.log(`[ERR] load ${app_name} api pathes failed. ${JSON.stringify(obj)}`)
		}
	}

	function updateApp(app_name, status) {
		if (app_name) {
			reqSysData(app_name);
			reqErrData(app_name, 5, loadErrData);
			reqTestData(app_name);
			// reqApiPath(app_name);
			reqApiTime(app_name);
			if (status) {
				updateStatus(app_name, status);
			}
		}
	}

	function showApp() {
		if (app_list.length > 0) {
			// console.log(index);
			index = Math.abs(index) % app_list.length;
			var app_name = app_list[index].name,
				status = app_list[index].status,
				app_id = `#${app_name}`;
			$('.app-item').hide();
			$(app_id).show();
			updateApp(app_name, status);
		}
	}

	function showDashboard() {
		$('.app-item').hide();
		$('#dashboard').show();
	}

	reqAppList();

	$('#btn-left').click(() => {
		--index;
		showApp();
	});

	$('#btn-right').click(() => {
		++index;
		showApp();
	});

	$('#navbar-summary').click(() => {
		index = 0;
		showDashboard();
	});

	function initEventListener() {
		app_list.forEach((app) => {
			var app_name = app.name,
				status = app.status;
			$(`span#nav-${app_name}`).click(() => {
				app_id = `#${app_name}`;
				$('.app-item').hide();
				$(app_id).show();
				updateApp(app_name, status);
			});
		});
	}
});
