ProJack.issues.directive('issueSearchDirective', ['KT', 'IssueService', 'CustomerService', function(KT, service, customerService) {

	var locKey = '__Projack.issues.searchDirective.criteria';
	
	var linkFn = function(scope, elem, attrs) {
	
		scope.issues = [];

		scope.customers = [];
	
		// read stored criterias from the local storage if available
		if (localStorage.getItem(locKey)) {
			scope.criteria = JSON.parse(localStorage.getItem(locKey));
			service.getIssuesByCriteria(scope.criteria).then(function(issues) {
				scope.issues = issues;
			});
		} else {
			scope.criteria = {
				customer : undefined
			};
		}
		
		customerService.getAllCustomers().then(function(customers) {
			scope.customers = customers;
		});
		
		scope.$watch('criteria', function(nval, oval) {
			if (nval && nval != oval) {
				service.getIssuesByCriteria(scope.criteria).then(function(issues) {
					scope.issues = issues;
					localStorage.setItem(locKey, JSON.stringify(scope.criteria));
				});
			}
		}, true);
		
		scope.selectIssue = function(issue) {
			KT.remove('_id', issue._id, scope.issues);
			scope.$emit('Issues::SearchDirective::issue-selected', issue);
		};
	};
	
	return {
		restrict : 'A',
		scope    : { },
		templateUrl : './modules/issues/views/directives/issue-search-directive.html',
		link : linkFn
	};
}]);	
