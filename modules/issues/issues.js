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
				notes		: []
			};
		},
		
		newNote : function() {
			return {
				_id				: KT.UUID(),
				text 			: '',
				timeSpentHours 	: 0,
				timeSpentMinutes: 0,
				dateCreated 	: new Date().getTime(),
				dateModified	: new Date().getTime(),
				userCreated 	: '',
				userModified	: ''
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
		
		calculateTimeOnIssue : function(issue) {
			// calculate the overall time on this issue
			var sumHours = 0;
			var sumMins  = 0;
			for (var i in issue.notes) {
				sumHours += issue.notes[i].timeSpentHours;
				sumMins  += issue.notes[i].timeSpentMinutes;
			}
			sumHours += Math.floor(sumMins / 60);
			sumMins   = sumMins%60;
		
			var retval = "";
			if (sumHours < 10)
				retval = "0";
			retval += sumHours + ":";
			if (sumMins < 10)
				retval += "0";
			retval += sumMins;
			return retval;
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
			issue.dateModified = new Date().getTime();
			return $http.put(ProJack.config.dbUrl + "/" + issue._id, issue)
				.then(function(response) {
					return response.data;
				});
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

ProJack.issues.controller('IssueEditController', ['$scope', '$routeParams', 'KT', 'IssueService', 'CustomerService', 'MilestoneService', 
                                                  function($scope, $routeParams, KT, service, customerService, milestoneService) {
	
	$scope.time = { spent : '' };
	
	service.getIssueById($routeParams.id).then(function(data) {
		$scope.issue = data;
		$scope.timeOnIssue = service.calculateTimeOnIssue($scope.issue);
	
		customerService.getCustomerById($scope.issue.customer).then(function(data) {
			$scope.customer = data;
		});
		
		milestoneService.getMilestoneById($scope.issue.milestone).then(function(data) {
			$scope.milestone = data;
			if ($scope.issue.feature && $scope.issue.feature != "") {
				$scope.feature = KT.find("_id", $scope.issue.feature, $scope.milestone.specification.features);
			}
		});
	});
	
	$scope.addNote = function() {
		$scope.note = service.newNote();
	};
	
	$scope.unfocusNote = function() {
		$scope.note = undefined;
		$scope.time.spent = "";
	};
	
	$scope.focusNote = function(n) {
		$scope.note = n;
		$scope.time.spent = n.timeSpentHours + ":" + n.timeSpentMinutes;
	}
	
	$scope.deleteNote = function(n) {
		KT.remove('_id', n._id, $scope.issue.notes);
		$scope.updateIssue();
	};
	
	$scope.updateIssue = function() {
		if ($scope.note) {
			KT.remove('_id', $scope.note._id, $scope.issue.notes);
			$scope.issue.notes.push($scope.note);
		}
		
		if ($scope.time && $scope.time.spent.length > 0) {
			var tmp = $scope.time.spent.split(":");
			$scope.note.timeSpentHours = parseInt(tmp[0]);
			$scope.note.timeSpentMinutes = parseInt(tmp[1]);
		}
		
		$scope.note = undefined;
		$scope.time.spent = "";
		
		service.updateIssue($scope.issue).then(function(data) {
			$scope.issue._rev = data.rev;
			$scope.timeOnIssue = service.calculateTimeOnIssue($scope.issue);
			KT.alert("Notiz gespeichert");
		});
	};
}]);