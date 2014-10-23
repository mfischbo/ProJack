ProJack.issues = angular.module("IssuesModule", ['CustomersModule', 'MileStonesModule', 'Utils']);
ProJack.issues.service("IssueService", ['$http', 'KT', function ($http, KT) {
	
	return {
		newIssue : function() {
			return {
				type		: 'issue',
				number		: 0,
				title		: '',
				description : '',
				milestone   : '', // id of the milestone this issue is related to
				feature		: '', // id of the feature this issue is related to
				customer	: '', // id of the customer this issue is related to
				assignedTo  : '', // the user the issue is assigned to
				reportedBy  : '', // the person who reported this issue 
				state		: 'NEW', // NEW, ASSIGNED, FEEDBACK, RESOLVED, CLOSED
				issuetype	: 'BUG', // BUG, FEATURE, CHANGE_REQUEST, SUPPORT
				dateCreated : new Date().getTime(),
				dateModified: new Date().getTime(),
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
		
		getIssuesByCriteria : function(criteria) {
			var url = ProJack.config.dbUrl + "/_design/issues/_view/search";
			url += '?startkey=["'+ this.saveId(criteria.customer, true) +'", "'+ this.saveId(criteria.milestone, true) +'", "NEW"]';
			url += '&endkey=["'+ this.saveId(criteria.customer, false) +'", "'+ this.saveId(criteria.milestone, false) +'", "'+criteria.status+'"]';
			
			return $http.get(url).then(function(response) {
				var retval = [];
				for (var i in response.data.rows) {
					retval.push(response.data.rows[i].value);
				}
				return retval;
			});
		},
		
		saveId : function (id, low) {
			if (!id || id == "") {
				if (low) return ProJack.config.lowId;
				return ProJack.config.highId;
			}
			return id;
		},
		
		createIssue : function(issue) {
			if (typeof issue.customer == "object")
				issue.customer = issue.customer._id;
			if (typeof issue.milestone == "object")
				issue.milestone = issue.milestone._id;
			if (typeof issue.feature == "object")
				issue.feature = issue.feature._id;
		
			// get the next available numerical ticket number
			// TODO: This kinda sucks! It'll be way cooler if we could set the 
			// number in couch on insert. Check out how this would be done
			$http.get(ProJack.config.dbUrl + "/_design/issues/_view/count?group=false").success(function(data) {
				if (data.rows.length == 0) {
					issue.number = 1;
				} else {
					issue.number = (parseInt(data.rows[0].value) + 1);
				}
				return $http.post(ProJack.config.dbUrl, issue)
					.then(function(response) {
						return response.data._id;
					});
			}).then(function(response) { 
				return response; 
			});
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

ProJack.issues.controller('IssueIndexController', ['$scope', 'KT', 'IssueService', 'CustomerService', 'MilestoneService', 
                                                   function($scope, KT, service, customerService, milestoneService) {

	var locKey = "__IssuesIndex_Criteria";
	
	$scope.criteria = {
		status : 'NEW',
		customer : undefined,
		milestone : undefined
	};
	
	if (sessionStorage.getItem(locKey)) {
		$scope.criteria = JSON.parse(sessionStorage.getItem(locKey));
	}
	
	customerService.getAllCustomers().then(function(data) {
		$scope.customers = data;
		if (!$scope.criteria.customer) {
			$scope.criteria.customer = data[0]._id;
			$scope.milestones = [{version : 'Alle Versionen', _id : "" }];
		}
	});
	
	$scope.$watch('criteria.customer', function(val) {
		if (!val || val.length == 0) return;
		if (!$scope.customers || $scope.customers.length == 0) return;
		
		milestoneService.getMilestonesByCustomer(KT.find('_id', val, $scope.customers))
			.then(function(data) {
				$scope.milestones = [{ version : 'Alle Versionen', _id : "" }];
				$scope.milestones = $scope.milestones.concat(data);
				if ($scope.milestones.length == 1) {
					$scope.criteria.milestone = "";
				}
			});
	});
	
	$scope.$watch('criteria', function() {
		sessionStorage.setItem(locKey, JSON.stringify($scope.criteria));
		service.getIssuesByCriteria($scope.criteria).then(function(data) {
			$scope.issues = data;
			console.log(data);
		});
	}, true);
	
}]);

ProJack.issues.controller('IssueCreateController', ['$scope', '$location', 'KT', 'IssueService', 'CustomerService', 'MilestoneService', 
                                                    function($scope, $location, KT, service, customerService, milestoneService) {
	
	$scope.issue = service.newIssue();
	
	customerService.getAllCustomers().then(function(data) {
		$scope.customers = data;
	});
	
	$scope.$watch('issue.customer', function(val) {
		if (!val || val.length == 0) return;
		milestoneService.getMilestonesByCustomer(KT.find('_id', val, $scope.customers))
			.then(function(data) {
				$scope.milestones = [{ version : 'Ohne Milestone', _id : '' }];
				$scope.milestones = $scope.milestones.concat(data);
			});
	});
	
	$scope.createIssue = function() {
		service.createIssue($scope.issue).then(function(data) {
			KT.alert("Das Issue wurde erfolgreich angelegt");
			$location.path("/issues");
		});
	};
}]);

ProJack.issues.controller('IssueEditController', ['$scope', '$routeParams', 'IssueService', 'CustomerService', 
                                                  function($scope, $routeParams, service, customerService) {
	
	service.getIssueById($routeParams.id).then(function(data) {
		$scope.issue = data;
	});
	
}]);