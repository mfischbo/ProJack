ProJack.calendar = angular.module("CalendarModule", ['Utils', 'MileStonesModule']);
ProJack.calendar.service("CalendarService", ['$http', '$q', 'KT', function($http, $q, KT) {
	
	return {
		getEntries : function(year, month) {
			return $http.get(ProJack.config.dbUrl + '/_design/timefeed/_view/milestones?startKey=['+year+','+month+',0,"MILESTONE", 0]&endKey=['+year+','+month+',31,"MILESTONE", 3]')
				.then(function(response) {
					var retval = {};
					
					for (var i = 1; i < 32; i++) {
						var rk = year + "-" + month + "-" + i;
						var rd = new Date(rk).getTime();
						retval[rd] = {
								specsdone: [],
								releases : [],
								payments : [],
								approvals: []
						};
						
						for (var q in response.data.rows) {

							var e = response.data.rows[q];
							var k = e.key[0] + "-" + e.key[1] + "-" + e.key[2];
							if (k == rk) {
								var milestone = e.value;
								if (e.key[4] == 0)
									retval[rd]['specsdone'].push(milestone);
								if (e.key[4] == 1)
									retval[rd]['approvals'].push(milestone);
								if (e.key[4] == 2)
									retval[rd]['releases'].push(milestone);
								if (e.key[4] == 3)
									retval[rd]['payments'].push(milestone);
							}
						}
					}
					return retval;
				});
		}
	}
	
}]);

ProJack.calendar.controller('CalendarIndexController', ['$scope', 'KT', 'CalendarService', 'MilestoneService', 
                                                        function($scope, KT, service, mService) {

	$scope.totalPayments = 0;
	$scope.developmentHours = 0;
	
	$scope.currentMonth = new Date().getMonth() + 1;
	$scope.currentYear  = new Date().getFullYear();

	
	$scope.getEntries = function() {
		$scope.totalPayments = 0;
		service.getEntries($scope.currentYear, $scope.currentMonth).then(function(entries) {
			$scope.entries = entries;
			
			for (var i in $scope.entries) {
				var e = $scope.entries[i];
				for (var q in e.payments) {
					mService.getAggregation(e.payments[q]).then(function(data) {
						$scope.totalPayments += data.budget;
					});
				}
			}
		});
	};
	$scope.getEntries();
	
	
	$scope.subMonth = function() {
		$scope.currentMonth--;
		if ($scope.currentMonth == 0) {
			$scope.currentMonth = 12;
			$scope.currentYear--;
		}
		$scope.getEntries();
	};
	
	$scope.addMonth = function() {
		$scope.currentMonth++;
		if ($scope.currentMonth == 13) {
			$scope.currentMonth = 1;
			$scope.currentYear++;
		}
		$scope.getEntries();
	};
	
	
	$scope.isToday = function(date) {
		var d = new Date().getTime();
		return (d >= date && d < date + 3600 * 24);
	};
	
	$scope.isWeekend = function(date) {
		var d = new Date(parseInt(date)).getDay();
		return (d == 0 || d == 6);
	};
}]);