ProJack.sprint.controller('SprintWorkbenchController', ['$scope', 'KT', 'SprintService', 'IssueService',
                                                        'CustomerService', 'SecurityService', '$uibModal',
                         function($scope, KT, sprintService, issueService, customerService, secService, $uibModal) {
	
	var locKey = "__Projack.sprints.current.id";
	
	// all available sprints and the current focused sprint
	$scope.sprints = [];
	$scope.currentSprint = {};

	// states for the overlays
	$scope.issueOverlayVisible = false;
	$scope.issueCreateOverlayVisible = false;
	$scope.tinymceOptions = ProJack.config.tinyOptions;

	
	var m = moment();
	m = m.subtract(1, 'months');
	sprintService.getSprintsStartingAt(m.toDate()).then(function(data) {
		$scope.sprints = data;
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

	/* -----------------------------------------------------
	 * Events emitted from lane components
	 * -----------------------------------------------------
	 */
	$scope.$on('lane-changed', function() {
		sprintService.saveSprint($scope.currentSprint).then(function(sprint) {
			$scope.currentSprint = sprint;
		});
	});

	
	$scope.$on('remove-lane-requested', function(event, lane) {
		if (lane.isDefaultLane) {
			console.error("You shouldn't even see this button!");
			return;
		} else {
			var issues = lane.issues;
			var defaultLane = KT.find('isDefaultLane', true, $scope.currentSprint.lanes);
			defaultLane.issues = defaultLane.issues.concat(issues);
			KT.remove('id', lane.id, $scope.currentSprint.lanes);
		}
	});
	
	
	/* --------------------------------
	 * Overlays
	 * --------------------------------*/
	$scope.toggleIssueOverlay = function() {
		$scope.issueCreateOverlayVisible = false;
		$scope.issueOverlayVisible = !$scope.issueOverlayVisible;
	};
	
	$scope.toggleIssueCreateOverlay = function() {
		$scope.issueOverlayVisible = false;
		$scope.issueCreateOverlayVisible = !$scope.issueCreateOverlayVisible;
	};
	
	$scope.$on('issue-created', function(event, issue) {
		
		// sort the issue in the default lane and update the lane directives
		var lane = KT.find('isDefaultLane', true, $scope.currentSprint.lanes);
		lane.issues.push(issue);
		sprintService.saveSprint($scope.currentSprint).then(function(sprint) {
			$scope.currentSprint = sprint;
			$scope.toggleIssueCreateOverlay();
			$scope.$broadcast('issuesReloaded');
		});
	});

	$scope.$on('close-requested', function() {
		$scope.toggleIssueCreateOverlay();
	});
}]);