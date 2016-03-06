ProJack.dashboard = angular.module('DashBoardModule', ['Utils', 'SecurityModule', 'nvd3']);
ProJack.dashboard.config(['$routeProvider', function($routeProvider) {

    $routeProvider
        .when('/', {
            controller : 'DashBoardController',
            templateUrl : './modules/dashboard/views/index.html'
        });
}]);

ProJack.dashboard.controller('DashBoardController', ['$scope',
	function($scope) {

}]);



ProJack.dashboard.controller('ExpressTicketsController', ['$scope', '$http', 'SecurityService', 'KT', function($scope, $http, secService, KT) {

	$scope.user = secService.getCurrentUserName();
	
	$scope.issues = [];
	$scope.assigned = [];
	$scope.currentTracked = [];
	
	$scope.initialize = function() {
			
		// fetch all non resolved assigned
		var key = '?startkey=["'+$scope.user+'", "ASSIGNED", 1]&endkey=["'+$scope.user+'", "ASSIGNED", '+Number.MAX_SAFE_INTEGER+']&limit=5';
		$http.get(ProJack.config.dbUrl + '/_design/issues/_view/byUserAndResolveDate' + key).success(function(data) {
			for (var i in data.rows) {
				$scope.issues.push(data.rows[i].value);
			}
		});
		
		// fetch all assigned to user
		var key = '?startkey=["'+$scope.user+'", "ASSIGNED", 0]&endkey=["'+$scope.user+'", "ASSIGNED", {}]';
		$http.get(ProJack.config.dbUrl + '/_design/issues/_view/byUserAndResolveDate' + key).success(function(data) {
			for (var i in data.rows) 
				$scope.assigned.push(data.rows[i].value);
		});
		
		// fetch currently running trackings
		var tkey = '?key="' + $scope.user + '"';
		$http.get(ProJack.config.dbUrl + '/_design/issues/_view/trackings' + tkey).success(function(data) {
			for (var i in data.rows) {
				var issue = data.rows[i].value;
				for (var q in issue.times) {
					if (issue.times[q].user == $scope.user)
						issue.times = issue.times[q];
				}
				$scope.currentTracked.push(issue);
			}
		});
	};
}]);


ProJack.dashboard.controller('IssueChartController', ['$scope', '$http', function($scope, $http) {
	
	var i18n   = { 
			BUG : 'Bugs', CHANGE_REQUEST : 'Change Requests',
			FEATURE : 'Features', SUPPORT : 'Support', 
			CLOSED : 'Closed', ASSIGNED : 'Assigned', RESOLVED : 'Resolved', CLOSED : 'Done', NEW : 'New', FEEDBACK : 'Feedback' };
	
	$scope.issuesByType = [];
	
	$scope.ibtOptions = { 
			chart : {
				type : 'multiBarChart',
				height : 350,
				showControls : true,
				x : function(d) {
					return d[0];
				},
				y : function(d) {
					return d[1];
				},
				stacked : true,
				color: function(d) {
					if (d.key == 'RESOLVED') return 'rgb(127, 242, 79)';
					if (d.key == 'ASSIGNED') return 'rgb(208, 87, 229)';
					if (d.key == 'NEW') return 'rgb(250, 106, 101)';
					if (d.key == 'CLOSED') return 'rgb(195,195,195)';
					if (d.key == 'FEEDBACK') return '#FDC169';
				},
				tooltip : function(key, x, y) {
					return '<h5 class="popover-title"><strong>' + x + '</strong></h5><p>' + y + ' sind ' + i18n[key] + '</p>';
				},
				legend : {
					key : function(v) {
						return i18n[v.key];
					}
				},
				yAxis : {
					tickFormat : function(v) {
						return v;
					}
				},
				xAxis : {
					tickFormat: function(v) {
						return i18n[v];
					}
				}
			}
	};
	
	$scope.initialize = function() {
		$http.get(ProJack.config.dbUrl + "/_design/issues/_view/byType?group=true").success(function(data) {
			data = data.rows; 	// the data 
			var t = "";				// the key for the issuetype
			
			var finDat = [];
			for (var x=0; x < data.length; x++) {
				if (t == data[x].key[0])
					continue;
				
				var b = ['BUG', 'CHANGE_REQUEST', 'FEATURE', 'SUPPORT'];
				t = data[x].key[0];
				var series = { 'key' : t, values : [] };
				if (t == 'CLOSED' || t == 'RESOLVED')
					series.disabled = true;
				
				for (var y in data) {
					if (data[y].key[0] == t) {
						series.values.push( [ data[y].key[1], data[y].value ]);
						b.splice(b.indexOf(data[y].key[1]), 1);
					}
				}
				for (var q in b) {
					series.values.push([ b[q], 0 ]);
				}
				
				finDat.push(series);
			}
			$scope.issuesByType = finDat;
		});
	};
}]);