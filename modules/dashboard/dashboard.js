ProJack.dashboard = angular.module('DashBoardModule', ['Utils', 'SecurityModule']);
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
		});
	};
	
}]);