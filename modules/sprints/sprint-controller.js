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
		$scope.qa		  = [];
		$scope.done       = [];
		$scope.issueCnt   = 0;
	
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
				if (item.state == 'RESOLVED')
					$scope.qa.push(item);
				if (item.state == 'CLOSED')
					$scope.done.push(item);
			}
			$scope.issueCnt = data.length;
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

	var checkTracking = function(issue) {
		// disallow to move issues that are currently time tracked
		if (iService.hasActiveTracking(issue)) {
			KT.alert('Timetracking muss gestoppt sein um das Ticket zu bewegen', 'warning');
			return false;
		}
		return true;
	}
	
	/**
	 * Methods to check whether or not the dropzone accepts the issue
	 */
	$scope.validateUnassignedDrop = function(issue) {
		if (KT.indexOf('_id', issue._id, $scope.unassigned) >= 0)
			return false;
		if (!checkTracking(issue))
			return false;
		return true;
	};

	$scope.validateInProgressDrop = function(issue) {
		if (KT.indexOf('_id', issue._id, $scope.inProgress) >= 0) 
			return false;
		if (!checkTracking(issue))
			return false;
		return true;
	};
	
	$scope.validateQADrop = function(issue) {
		// disallow droping to itself
		if (KT.indexOf('_id', issue._id, $scope.qa) >= 0)
			return false;
		if (!checkTracking(issue))
			return false;
		return true;
	};
	
	$scope.validateDoneDrop = function(issue) {
		// only allow dropping from QA lane
		if (KT.indexOf('_id', issue._id, $scope.qa) >= 0)
			return true;
		if (!checkTracking(issue))
			return false;
		return false;
	};
	
	$scope.removeFromSprint = function(issue) {
		issue.sprint = '';
		iService.updateIssue(issue).then(function() {
			KT.remove('_id', issue._id, $scope.unassigned);
		});
	};
	
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
				KT.remove('_id', issue._id, $scope.qa);
			});
		}
		$scope.unassigned.push(issue);
	};
	
	
	/**
	 * Handler to be called when dropping item on the inProgress lane
	 * Issue will be stated to ASSIGNED for the current user, saved and removed from all other lanes
	 */
	$scope.onInProgressDrop = function($event, issue) {
		// update the issue ... set to assigned and assign the current user
		issue.state = 'ASSIGNED';
		issue.assignedTo = secService.getCurrentUserName();
		iService.updateIssue(issue).then(function() {
			KT.remove('_id', issue._id, $scope.unassigned);
			KT.remove('_id', issue._id, $scope.done);
			KT.remove('_id', issue._id, $scope.qa);
			$scope.inProgress.push(issue);
		});
	};
	
	/**
	 * Handler to be called when dropping item on the QA lane
	 * Issue will be stated as RESOLVED and modal will open to leave notes.
	 * Issue will be saved on modal success.
	 */
	$scope.onQADrop = function($event, issue) {
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
			KT.remove('_id', issue._id, $scope.done);
			$scope.qa.push(issue);
		});
	};

	
	/**
	 * Handler to be called when issue is dropped on done lane.
	 * Issue will be stated to CLOSED and saved
	 */
	$scope.onDoneDrop = function($event, issue) {
		issue.state = 'CLOSED';
		iService.updateIssue(issue).then(function() {
			KT.remove('_id', issue._id, $scope.qa);
			$scope.done.push(issue);
		});
	};
	
	
	/**
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
	
	/**
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
			$scope.milestones.push({name : 'Alle Versionen', _id : ''});
			$scope.milestones.push({name : 'Ohne Milestone', _id : ProJack.config.lowId});
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


/**
 * Controller for creating a new sprint 
 */
ProJack.sprint.controller('SprintCreateController', ['$scope', '$location', 'SprintService', 'KT', function($scope, $location, service, KT) {

	$scope.sprint = service.newSprint();
	
	$scope.saveSprint = function() {
		service.saveSprint($scope.sprint).then(function() {
			KT.alert("Der Sprint wurde angelegt");
			$location.path('/sprints');
		});
	};
}]);