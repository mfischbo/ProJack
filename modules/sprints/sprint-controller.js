ProJack.sprint.controller('SprintIndexController', ['$scope', 'KT', 'SprintService', 'IssueService', 'CustomerService', 'MilestoneService', 
                                                    function($scope, KT, service, iService, cService, mService ) {

	// All future sprints and the current sprint
	$scope.sprints = [];
	$scope.sprint = {};

	// States if the issue overlay is visible
	$scope.issueOverlayVisible = false;
	
	// issues
	$scope.unassigned = [{ number : 5}, {number : 6}];
	
	
	service.getFutureSprints().then(function(data) {
		$scope.sprints = data;
		$scope.sprint = data[0];
	});
	
	$scope.toggleIssueOverlay = function() {
		$scope.issueOverlayVisible = !$scope.issueOverlayVisible;
	};
	
	
	$scope.issues = [];
	$scope.customers = [];

	$scope.criteria = {
			status		: 1,
			customer	: undefined,
			milestone	: undefined
	};
	
	cService.getAllCustomers().then(function(data) {
		$scope.customers = data;
	});

	$scope.$watch('criteria.customer', function(val) {
		if (!$scope.criteria.customer) return;
		mService.getMilestonesByCustomer($scope.criteria.customer).then(function(data) {
			$scope.milestones = data;
		});
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
	});
	
	$scope.onIssueDrop = function($event, issue) { 
		KT.remove('_id', issue._id, $scope.issues);
		$scope.unassigned.push(issue);
	};
	
	
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