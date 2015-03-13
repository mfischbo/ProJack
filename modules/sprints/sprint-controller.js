ProJack.sprint.controller('SprintIndexController', ['$scope', 'KT', 'SprintService', 'IssueService', 'CustomerService', 'MilestoneService', 'SecurityService', '$modal',
                                                    function($scope, KT, service, iService, cService, mService, secService, $modal) {

	var locKey = '__ProJack.sprints.current.id';
	
	// All future sprints and the current sprint
	$scope.sprints = [];
	$scope.sprint = {};

	// States if the issue overlay is visible
	$scope.issueOverlayVisible = false;
	$scope.issueCreateOverlayVisible = false;
	$scope.tinymceOptions = ProJack.config.tinyOptions;
	
	// issue to be created from the overlay
	$scope.issue 	  = iService.newIssue();

	$scope.progressVisible = 'ALL';		// or OWN to display only issues assigned to current user
	$scope.currentUserName = secService.getCurrentUserName();
	
	$scope.selectedMilestone = undefined;

	// load the all future sprints and take the closest release as the current
	var m = moment();
	m.subtract(1, 'months');
	service.getSprintsStartingAt(m.toDate()).then(function(data) {
		$scope.sprints = data;
		if (localStorage.getItem(locKey)) {
			var current = localStorage.getItem(locKey);
			for (var i in $scope.sprints)
				if ($scope.sprints[i]._id == current)
					$scope.sprint = $scope.sprints[i];
		} else {
			$scope.sprint = data[0];
		}
		
		$scope.initializeSprint();
	});

	/**
	 * Loads all tickets for the given sprint and sorts it in the lanes
	 */
	$scope.initializeSprint = function() {
		// update the empty issue
		$scope.issue.resolveUntil = $scope.sprint.releaseAt;

		// clear all issue lanes
		$scope.unassigned = [];
		$scope.inProgress = [];
		$scope.done       = [];
	
		// load all related issues and sort them
		iService.getIssuesBySprint($scope.sprint).then(function(data) {
			for (var i in data) {
				var item = data[i];
				if ((!item.assignedTo || item.assignedTo.length == 0) && item.state != 'CLOSED' && item.state != 'RESOLVED') {
					$scope.unassigned.push(item);
				}
				if (item.assignedTo && item.assignedTo.length > 0 && item.state != 'CLOSED' && item.state != 'RESOLVED') {
					$scope.inProgress.push(item);
				}
				if (item.state == 'CLOSED' || item.state == 'RESOLVED')
					$scope.done.push(item);
			}
		});
	};
	
	$scope.switchSprint = function(sprint) {
		$scope.sprint = sprint;
		$scope.initializeSprint();
		localStorage.setItem(locKey, $scope.sprint._id);
	};
	
	
	$scope.toggleIssueOverlay = function() {
		$scope.issueCreateOverlayVisible = false;
		$scope.issueOverlayVisible = !$scope.issueOverlayVisible;
	};
	
	$scope.toggleIssueCreateOverlay = function() {
		$scope.issueOverlayVisible = false;
		$scope.issueCreateOverlayVisible = !$scope.issueCreateOverlayVisible;
	};
	
	/**
	 * Methods to check whether or not the dropzone accepts the issue
	 */
	$scope.validateUnassignedDrop = function(issue) {
		if (KT.indexOf('_id', issue._id, $scope.unassigned) >= 0)
			return false;
		return true;
	};

	$scope.validateInProgressDrop = function(issue) {
		if (KT.indexOf('_id', issue._id, $scope.inProgress) >= 0) 
			return false;
		return true;
	}
	$scope.validateDoneDrop = function(issue) {
		var q = KT.indexOf('_id', issue._id, $scope.done);
		if (KT.indexOf('_id', issue._id, $scope.done) >= 0) 
			return false;
		return true;
	}
	
	/**
	 * Handler to be called, when dragging from the issue overlay to the unassigned lane
	 */
	$scope.onUnassignedDrop = function($event, issue) { 
		if (!issue.sprint || issue.sprint.length == 0) {
			// assign the issue to the current sprint
			issue.sprint = $scope.sprint._id;
			iService.updateIssue(issue).then(function(data) {
				KT.remove('_id', issue._id, $scope.issues);
			});
		} else {
			issue.assignedTo = '';
			issue.state      = 'NEW';
			iService.updateIssue(issue).then(function(data) {
				KT.remove('_id', issue._id, $scope.inProgress);
				KT.remove('_id', issue._id, $scope.done);			
			});
		}
		$scope.unassigned.push(issue);
	};
	
	$scope.onInProgressDrop = function($event, issue) {
		// update the issue ... set to assigned and assign the current user
		issue.state = 'ASSIGNED';
		issue.assignedTo = secService.getCurrentUserName();
		iService.updateIssue(issue).then(function() {
			KT.remove('_id', issue._id, $scope.unassigned);
			KT.remove('_id', issue._id, $scope.done);
			$scope.inProgress.push(issue);
		});
	};
	
	$scope.onDoneDrop = function($event, issue) {
		issue.state = 'RESOLVED';
		issue.assignedTo = '';
		var instance = $modal.open({
			controller:		'IssueResolveModalController',
			templateUrl:	'./modules/issues/views/resolve-modal.html',
			size:			'lg',
			resolve: {
				data : function() {
					return { issue : issue }
				}
			}
		});
		instance.result.then(function() {
			KT.remove('_id', issue._id, $scope.unassigned);
			KT.remove('_id', issue._id, $scope.inProgress);
			$scope.done.push(issue);
		});
	};
	
	
	/*
	 * Create new issues from the overlay
	 */
	$scope.createIssue = function() {
		$scope.issue.sprint = $scope.sprint._id;
		iService.createIssue($scope.issue).then(function(data) {
			$scope.unassigned.push(data);
			$scope.issue = iService.newIssue();
			$scope.issue.resolveUntil = $scope.sprint.releaseAt;
		});
	};
	
	/*
	 * Issue overlay controller. Must stay here for drag/drop to work properly 
	 */
	$scope.issues = [];
	$scope.customers = [];

	$scope.criteria = {
			status		: 1,
			customer	: undefined,
			milestone	: undefined
	};
	if (localStorage.getItem('__ProJack.Sprint.IssueOverlay.criteria') != undefined) {
		$scope.criteria = JSON.parse(localStorage.getItem('__ProJack.Sprint.IssueOverlay.criteria'));
	}
	
	cService.getAllCustomers().then(function(data) {
		$scope.customers = data;
	});

	$scope.$watch('criteria.customer', function(val) {
		if (!$scope.criteria.customer) return;
		mService.getMilestonesByCustomer($scope.criteria.customer).then(function(data) {
			$scope.milestones = data;
		});
		localStorage.setItem('__ProJack.Sprint.IssueOverlay.criteria', JSON.stringify($scope.criteria));
	});
	
	$scope.$watch('criteria.milestone', function(val) {
		if (!val) return;
		var criteria = {
				customer : $scope.criteria.customer._id,
				milestone: $scope.criteria.milestone,
				status	 : 1
		}
		iService.getIssuesByCriteria(criteria).then(function(data) {
			$scope.issues = data;
		});
		localStorage.setItem('__ProJack.Sprint.IssueOverlay.criteria', JSON.stringify($scope.criteria));
	});
}]);

ProJack.sprint.controller('SprintCreateController', ['$scope', '$location', 'SprintService', 'KT', function($scope, $location, service, kt) {

	$scope.sprint = service.newSprint();
	
	$scope.saveSprint = function() {
		service.saveSprint($scope.sprint).then(function() {
			kt.alert("Der Sprint wurde angelegt");
			$location.path('/sprints');
		});
	};
}]);