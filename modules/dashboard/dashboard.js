ProJack.dashboard = angular.module('DashBoardModule', ['Utils', 'SecurityModule', 'nvd3']);
ProJack.dashboard.controller('DashBoardController', ['$scope',
	function($scope) {

}]);


ProJack.dashboard.controller('AssignedTasksController', ['$scope', '$http', 'SecurityService', 'KT', function($scope, $http, secService, KT) {

	// the user currently logged in
	$scope.user = secService.getCurrentUserName();

	// the array of all upcoming assignments
	$scope.assignments = [];

	$scope.initialize = function() {
	
		// fetch all milestones
		$http.get(ProJack.config.dbUrl + '/_design/milestones/_list/inDevelopmentFilter/index').success(function(ms) {
			var milestones  = ms.rows;
			
			// fetch all assignments 
			var now = new Date().getTime() - 3600  * 24 * 1000;
			var key = '?startkey=["' + $scope.user + '", "' + now + '"]&endkey=["'+ $scope.user+'", "'+ (now + 3600 * 24 * 7 * 1000)+'"]'; 
			$http.get(ProJack.config.dbUrl + '/_design/assignments/_view/byUserAndDate' + key).success(function(data) {
			
				// join with milestones
				for (var i in data.rows) {
					var a = data.rows[i].value;
					if (a.lower.milestone && a.lower.milestone.length > 0)
						a.lower.milestone = KT.find('_id', a.lower.milestone, milestones);
					if (a.upper.milestone && a.upper.milestone.length > 0)
						a.upper.milestone = KT.find('_id', a.upper.milestone, milestones);
					$scope.assignments.push(a);
				}
			});
		});
	};
}]);


ProJack.dashboard.controller('ExpressTicketsController', ['$scope', '$http', 'SecurityService', 'KT', function($scope, $http, secService, KT) {

	$scope.user = secService.getCurrentUserName();
	
	$scope.issues = [];
	$scope.assigned = [];
	
	$scope.initialize = function() {
		
		// fetch all milestones
		$http.get(ProJack.config.dbUrl + '/_design/milestones/_list/inDevelopmentFilter/index').success(function(ms) {
			var milestones = ms.rows;
			
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
		});
	};
}]);


ProJack.dashboard.controller('IssueChartController', ['$scope', '$http', function($scope, $http) {
	
	var colmap = { NEW: '#e51c23', ASSIGNED: '#bbbbbb', RESOLVED: '#9c27b0',  FEEDBACK: '#ff9800', CLOSED : '' };
	var i18n   = { 
			BUG : 'Bugs', CHANGE_REQUEST : 'Change Requests',
			FEATURE : 'Features', SUPPORT : 'Support', 
			CLOSED : 'Geschlossen', ASSIGNED : 'Zugewiesen', RESOLVED : 'Fertig', CLOSED : 'Geschlossen', NEW : 'Neu', FEEDBACK : 'Feedback' };
	
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
				color: function(d) {
					if (d.key == 'RESOLVED') return 'rgb(195, 195, 195)';
					if (d.key == 'ASSIGNED') return 'rgb(208, 87, 229)';
					if (d.key == 'NEW') return 'rgb(250, 106, 101)';
					if (d.key == 'CLOSED') return 'rgb(127, 242, 79)';
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
			var data = data.rows; 	// the data 
			var t = "";				// the key for the issuetype
			var mMax = 0;
			
			var finDat = [];
			for (var x=0; x < data.length; x++) {
				if (t == data[x].key[0])
					continue;
				
				var b = ['BUG', 'CHANGE_REQUEST', 'FEATURE', 'SUPPORT'];
				t = data[x].key[0];
				var series = { 'key' : t, values : [] };
		
				for (var y in data) {
					if (data[y].key[0] == t) {
						series.values.push( [ data[y].key[1], data[y].value ]);
						b.splice(b.indexOf(data[y].key[1]), 1);
					}
				}
				// TODO: entries from b need to be in the same order
				for (var q in b) {
					series.values.push([ b[q], 0 ]);
				}
				
				finDat.push(series);
			}
			$scope.issuesByType = finDat;
		});
	};
}]);