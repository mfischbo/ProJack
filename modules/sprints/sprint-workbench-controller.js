ProJack.sprint.controller('SprintWorkbenchController', ['$scope', 'KT', 'SprintService', 'IssueService',
                                                        'SecurityService', '$uibModal',
                         function($scope, KT, sprintService, issueService, secService, $uibModal) {
	
	var locKey = "__Projack.sprints.current.id";
	
	// all available sprints and the current focused sprint
	$scope.sprints = [];
	$scope.currentSprint = undefined;

	// states for the overlays
	$scope.issueOverlayVisible = false;
	$scope.issueCreateOverlayVisible = false;
	$scope.tinymceOptions = ProJack.config.tinyOptions;
	
	// contains data for overall sprint stats
	$scope.stats = {
			unassigned : 0,
			inProgress : 0,
			qa: 0,
			done : 0,
			count : 0
	};

	
	var m = moment();
	m = m.subtract(1, 'months');
	sprintService.getSprintsStartingAt(m.toDate()).then(function(data) {
		$scope.sprints = data;
		if (data.length == 0)
			return;
		
		var sprintId = undefined;
		if (localStorage.getItem(locKey)) {
			var current = localStorage.getItem(locKey);
			var tmp = KT.find('_id', current, $scope.sprints);
			sprintId = tmp._id;
		} else {
			sprintId = data[0]._id;
		}
		
		sprintService.getSprintById(sprintId).then(function(sprint) {
			$scope.currentSprint = sprint;
			
			// calculate the stats on the current sprint
			for (var i in sprint.lanes) {
				for (var q in sprint.lanes[i].issues) {
					var issue = sprint.lanes[i].issues[q];
					if (issue.state == 'NEW') $scope.stats.unassigned++;
					if (issue.state == 'ASSIGNED') $scope.stats.inProgress++;
					if (issue.state == 'RESOLVED') $scope.stats.qa++;
					if (issue.state == 'CLOSED') $scope.stats.done++;
					$scope.stats.count++;
				}
			}
		});
	});


	$scope.switchSprint = function(sprint) {
		sprintService.getSprintById(sprint._id).then(function(sprint) {
			$scope.currentSprint = sprint;
			localStorage.setItem(locKey, sprint._id);
		});
	};
	
	
	$scope.addSwimlane = function() {
		$scope.currentSprint.lanes.push(sprintService.newSwimlane(false));
		sprintService.saveSprint($scope.currentSprint).then(function(sprint) {
			$scope.currentSprint = sprint;
		});
	};
	
	
	$scope.finalizeSprint = function() {
	
		for (var i in $scope.currentSprint.lanes) {
			var lane = $scope.currentSprint.lanes[i];
		
			for (var q = lane.issues.length-1; q >= 0; q--) {
				var issue = lane.issues[q];
				if (issue.state == 'NEW') {
					KT.remove('_id', issue._id, lane.issues);
				}
			}
		}
		sprintService.saveSprint($scope.currentSprint).then(function(sprint) {
			$scope.currentSprint = sprint;
		});
		$scope.$broadcast('Sprints::Workbench::issues-reloaded');
	};
	

	/* -----------------------------------------------------
	 * Events emitted from lane components
	 * -----------------------------------------------------
	 */
	$scope.$on('Sprints::Swimlane::lane-changed', function() {
		sprintService.saveSprint($scope.currentSprint).then(function(sprint) {
			$scope.currentSprint = sprint;
		});
		$scope.$broadcast('Sprints::Workbench::issues-reloaded');
	});


	/* --------------------------------
	 * Overlays
	 * --------------------------------*/
	$scope.toggleIssueSearchOverlay = function() {
		$scope.issueCreateOverlayVisible = false;
		$scope.issueSearchOverlayVisible = !$scope.issueSearchOverlayVisible;
	};
	
	$scope.toggleIssueCreateOverlay = function() {
		$scope.issueSearchOverlayVisible = false;
		$scope.issueCreateOverlayVisible = !$scope.issueCreateOverlayVisible;
	};
	
	$scope.$on('Issues::CreateDirective::issue-created', function(event, issue) {
		
		// sort the issue in the default lane and update the lane directives
		var lane = KT.find('isDefaultLane', true, $scope.currentSprint.lanes);
		lane.issues.push(issue);
		sprintService.saveSprint($scope.currentSprint).then(function(sprint) {
			$scope.currentSprint = sprint;
			$scope.toggleIssueCreateOverlay();
			$scope.$broadcast('Sprints::Workbench::issues-reloaded');
		});
	});

	$scope.$on('Issues::CreateDirective::close-requested', function() {
		$scope.toggleIssueCreateOverlay();
	});
	
	
	$scope.$on('Issues::SearchDirective::issue-selected', function(event, issue) {
		var lane = KT.find('isDefaultLane', true, $scope.currentSprint.lanes);
		if (lane && lane.issues) {
		
			// make sure the issue is not already in the current sprint
			if (sprintService.containsIssue($scope.currentSprint, issue)) {
				KT.alert('The issue is already part of this sprint', 'warning');
				return;
			}
			
			lane.issues.push(issue);
			sprintService.saveSprint($scope.currentSprint).then(function(sprint) {
				$scope.currentSprint = sprint;
				$scope.$broadcast('Sprints::Workbench::issues-reloaded');
			});
		};
	});
}]);