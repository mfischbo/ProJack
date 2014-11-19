/**
 * Controller for the index page of the calendar
 */
ProJack.calendar.controller('CalendarIndexController', ['$scope', 'KT', 'CalendarService', 'MilestoneService', 'SecurityService',
                                                        function($scope, KT, service, mService, secService) {

	// aggregation data
	$scope.totalPayments = 0;
	$scope.developmentHours = 0;
	$scope.totalTime = 0;

	// the current month / year selection
	$scope.currentMonth = new Date().getMonth() + 1;
	$scope.currentYear  = new Date().getFullYear();

	// currently unused
	$scope.focusedMilestone = undefined;
	
	// the template selection for printing the milestone
	$scope.template = { _id : undefined };
	
	// the list of assignemnts
	$scope.assignments = [];
	
	// show only releases and approvals
	$scope.laneFilter = false;

	// a set of key value pairs containing the assigned time
	// for each milestone
	$scope.milestoneHours = {};

	/**
	 * Fetches all entries for the calendar
	 */
	$scope.getEntries = function() {
		
		// reset aggregation data on each call
		$scope.totalPayments = 0;
		$scope.developmentHours = 0;
		$scope.totalTime = 0;
	
		// fetch the entries for the current month / year selection
		service.getEntries($scope.currentYear, $scope.currentMonth).then(function(entries) {
			$scope.entries = entries;
			
			// fetch milestone data aggregation for each milestone
			var keys = [];
			for (var i in $scope.entries) {
				keys.push(i);
				var e = $scope.entries[i];
				for (var q in e.payments) {
					mService.getAggregation(e.payments[q]).then(function(data) {
						$scope.totalPayments += data.budget;
						
						$scope.developmentHours += data.developmentTime;
						$scope.totalTime += data.totalTime;
					});
				}
			}
		
			service.getAllAssignments(keys[0], keys[keys.length -1]).then(function(assignments) {
				$scope.assignments = assignments;
			});
			
			service.getAssignedMilestoneHours().then(function(data) {
				$scope.milestoneHours = data;
			});
			
			secService.getAllUserNames().then(function(users) {
				$scope.users = users;
			});
		});
	};
	
	// initially load all entries
	$scope.getEntries();
	
	/**
	 * Shows details for the given document
	 * currently not used
	 */
	$scope.showDetails = function(doc) {
		if (doc.type == 'milestone')
			$scope.focusedMilestone = doc;
	};
	
	$scope.printReport = function(type) {
		var model = service.transformToReportModel($scope.entries);
		service.printReport(model, $scope.template, type);
	};
	
	
	$scope.saveAssignments = function() {
		service.saveAssignments($scope.assignments).then(function() {
			KT.alert('Alle Zuweisungen wurden gespeichert');
		});
	};
	
	$scope.getAssignment = function(date, user) {
		for (var i in $scope.assignments) {
			var a = $scope.assignments[i];
			if (a.date == date && a.user == user.login) {
				return a;
			}
		}
		
		// not found ... return white
		return { lower : { laneColor : 'ffffff' }, upper : { laneColor : 'ffffff' } };
	},
	
	$scope.assignSlice = function(date, user, loru, $event) {
		
		if (!$event.ctrlKey && !$scope.focusedMilestone) {
			KT.alert("Bitte zuerst auf einen Milestone klicken", 'warning');
			return;
		}
		
		// find the assignment or return use a new one
		var assignment = undefined;
		var currentIdx = 0;		// remember for when removing a assignment
		for (var i in $scope.assignments) {
			var a = $scope.assignments[i];
			if (a.date == date && a.user == user.login) {
				assignment = a;
				break;
			}
			currentIdx++;
		}
		
		// if none found and ctrl key is not pressed created a new one and add to assignments
		if (!assignment && !$event.ctrlKey) {
			assignment = service.newAssignment(date, user);
			$scope.assignments.push(assignment);
		}
		
		if (!$event.ctrlKey) {
			assignment[loru].milestone = $scope.focusedMilestone._id;
			assignment[loru].laneColor = $scope.focusedMilestone.laneColor;
		} else {
			assignment[loru].milestone = '';
			assignment[loru].laneColor = 'ffffff';
		
			// if both slots are empty purge the assignment
			if (assignment['lower'].milestone.length == 0 && assignment['upper'].milestone.length == 0 && assignment._id) {
				service.deleteAssignment(assignment).success(function() {
					$scope.assignments.splice(currentIdx, 1);
				});
			}
		}
	};
	
	
	$scope.getTotalTime = function(milestone) {
		return mService.getMilestoneBudget(milestone).totalTime;
	};
	
	$scope.getTotalBudget = function(milestone) {
		return mService.getMilestoneBudget(milestone).budget;
	};
	
	$scope.getFeatureSum = function(milestone, backend) {
		return mService.getFeatureSum(milestone, backend);
	};
	
	$scope.getAssignedTime = function(milestone) {
		
		var retval = $scope.milestoneHours[milestone._id] * 3600; // saved times
		if (!retval)
			retval = 0;
		
		// sum up all non saved assignments
		for (var i in $scope.assignments) {
			var a = $scope.assignments[i];
			
			if (a.lower.milestone == milestone._id && !a._id)
				retval += (4 * 3600);
			if (a.upper.milestone == milestone._id && !a._id)
				retval += (4 * 3600);
		}
		return retval;
	};

	$scope.$watch('focusedMilestone.plannedApprovalDate', function(nval, oval) {
		if (!nval || !oval) return;
		var sd = new Date(oval);
		var src = new Date(sd.getFullYear() + "-" + (sd.getMonth()+1) + "-" + sd.getDate()).getTime();
		var td = new Date(nval);
		var dst = new Date(td.getFullYear()  + "-" + (td.getMonth()+1) + "-" + td.getDate()).getTime();
		
		for (var i in $scope.entries[src]['approvals']) {
			if ($scope.entries[src]['approvals'][i]._id == $scope.focusedMilestone._id) {
				$scope.entries[src]['approvals'].splice(i,1);
				break;
			}
		}
		$scope.entries[dst]['approvals'].push($scope.focusedMilestone);
	});

	$scope.$watch('focusedMilestone.plannedReleaseDate', function(nval, oval) {
		if (!nval || !oval) return;
		var sd = new Date(oval);
		var src = new Date(sd.getFullYear() + "-" + (sd.getMonth()+1) + "-" + sd.getDate()).getTime();
		var td = new Date(nval);
		var dst = new Date(td.getFullYear()  + "-" + (td.getMonth()+1) + "-" + td.getDate()).getTime();
		
		for (var i in $scope.entries[src]['releases']) {
			if ($scope.entries[src]['releases'][i]._id == $scope.focusedMilestone._id) {
				$scope.entries[src]['releases'].splice(i,1);
				break;
			}
		}
		$scope.entries[dst]['releases'].push($scope.focusedMilestone);
	});

	
	$scope.unfocusMilestone = function() {
		$scope.focusedMilestone = undefined;
	};
	
	$scope.saveMilestone = function() {
		mService.updateMilestone($scope.focusedMilestone).then(function(data) {
			$scope.focusedMilestone._rev = data.rev;
		});
	};
	
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