ProJack.issues = angular.module("IssuesModule", ['CustomersModule', 'Utils']);
ProJack.issues.service("IssueService", ['$http', 'KT', function ($http, KT) {
	
	return {
		newIssue : function() {
			return {
				_type		: 'issue',
				number		: 0,
				title		: '',
				description : '',
				milestone   : '', // id of the milestone this issue is related to
				feature		: '', // id of the feature this issue is related to
				customer	: '', // id of the customer this issue is related to
				assignedTo  : '', // the user the issue is assigned to
				reportedBy  : '', // the person who reported this issue 
				state		: 'NEW', // NEW, ASSIGNED, FEEDBACK, RESOLVED, CLOSED
				type		: 'BUG', // BUG, FEATURE, CHANGE_REQUEST,
				notes		: [],
				slices		: []
			};
		},
		
		newSlice : function() {
			return {
				startedAt 	: new Date().getTime(),
				endedAt		: undefined,
				user		: ''
			};
		},
		
		getIssueById : function(id) {
			return $http.get(ProJack.config.dbUrl + "/" + id)
				.then(function(response) {
					return response.data;
				});
		},
		
		getAllIssues : function() {
			return $http.get(ProJack.config.dbUrl + "/_design/issues/_view/index")
				.then(function(response) {
					var retval = [];
					for (var i in response.data.rows)
						retval.push(response.data.rows[i].value);
					return retval;
				});
		},
		
		getIssuesByCustomer : function(customer) {
			return $http.get(ProJack.config.dbUrl + '/_design/issues/_view/byCustomer?key="'+customer._id+'"')
				.then(function(response) {
					
				});
		},
		
		getIssuesByMilestone : function(milestone) {
			return $http.get(ProJack.config.dbUrl + '/_design/issues/_view/byMilestone?key="'+milestone._id+'"')
				.then(function(response) {
					
				});
		},
		
		createIssue : function(issue) {
			return $http.post(ProJack.config.dbUrl, issue)
				.then(function(response) {
					return response.data;
				})
		},
		
		updateIssue : function(issue) {
			return $http.put(ProJack.config.dbUrl + "/" + issue._id, issue)
				.then(function(response) {
					return response.data;
				})
		},
		
		deleteIssue : function(issue) {
			return $http({
				method 	: 'DELETE',
				url 	: ProJack.config.dbUrl + "/" + issue._id + "?rev=" + issue._rev 
			});
		}
	};
}]);

ProJack.issues.controller('IssueIndexController', ['$scope', 'IssueService', 'CustomerService', 
                                                   function($scope, service, customerService) {
	
}]);

ProJack.issues.controller('IssueCreateController', ['$scope', 'IssueService', 'CustomerService', 
                                                    function($scope, service, customerService) {
	
}]);

ProJack.issues.controller('IssueEditController', ['$scope', '$routeParams', 'IssueService', 'CustomerService', 
                                                  function($scope, $routeParams, service, customerService) {
	
}]);