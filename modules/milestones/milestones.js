ProJack.milestones = angular.module('MileStonesModule', ['Utils', 'CustomersModule', 'IssuesModule', 'TemplateModule']);

ProJack.milestones.service("MilestoneService", ['$http', 'KT', 'IssueService', function($http, KT, iService) {
	
	return {
		
		/**
		 * Creates a new milestone and initializes it with sane values
		 */
		newMilestone: function() {
			return {
				type 				: 'milestone',
				customer 			: '',
				dateCreated 		: new Date().getTime(),
				dateModified 		: new Date().getTime(),
				name 				: '',
				description 		: '',
				version 			: '',
				plannedReleaseDate 	: '',
				actualReleaseDate 	: '',
				approvedBy			: '',
				certifiedBy			: '',
				status				: 'NEW', // NEW, APPROVAL_REQUESTED, APPROVED, CERTIFIED
				specification : {
					authors 	: [],
					dateCreated : new Date().getTime(),
					title 		: '',
					features 	: []
				}
			};
		},
	
		/**
		 * Creates a new feature with sane values 
		 */
		newFeature : function() {
			return {
				_id 			: KT.UUID(),
				title  			: '',
				requirement 	: '',
				implementation 	: '',
				result 			: '',
				internalNote 	: '',
				estimatedEffort : '00:00',
				createIssue     : true,
				questions 		: []
			};
		},
	
		/**
		 * Creates a new question with sane values
		 */
		newQuestion : function() {
			return {
				_id 		: KT.UUID(),
				question 	: '',
				answer   	: '',
				answeredBy 	: '',
				referencedQuestion : ''
			};
		},
	
		/**
		 * Returns a promise returning all milestones on success
		 */
		getAllMilestones : function() {
			var p = $http.get(ProJack.config.dbUrl + "/_design/milestones/_view/index")
				.then(function(response) {
					var retval = [];
					for (var i in response.data.rows) {
						retval.push(response.data.rows[i].value);
					}
					return retval;
				});
			return p;
		},
	
		/**
		 * Returns a promise returning all milestones for the given customer
		 */
		getMilestonesByCustomer : function(customer) {
			var p = $http.get(ProJack.config.dbUrl + '/_design/milestones/_view/byCustomer?key="'+customer._id+'"')
				.then(function(response) {
					var retval = [];
					for (var i in response.data.rows) {
						retval.push(response.data.rows[i].value);
					}
					return retval;
				});
			return p;
		},
	
		/**
		 * Returns a promise returning a milestone for the given id
		 */
		getMilestoneById : function(id) {
			var p = $http.get(ProJack.config.dbUrl + "/" + id)
				.then(function(response) {
					var retval = response.data;
					retval.attachments = [];
					for (var i in retval._attachments) 
						retval.attachments.push({ name : i, type : retval._attachments[i]['content_type'], size : retval._attachments[i].length });
					return retval;
				});
			return p;
		},
	
		/**
		 * Returns a promise containing the data for a persisted milestone.
		 * Use this when you want to save a new milestone
		 */
		createMilestone : function(milestone) {
			var p = $http.post(ProJack.config.dbUrl, milestone)
				.then(function(response) {
					

					return response.data;
				});
			return p;
		},
	
		/**
		 * Returns a promise updating a already persisted milestone
		 */
		updateMilestone : function(milestone) {
			milestone.dateModified = new Date().getTime();
			
			// add a new issue if createIssue is true
			for (var k in milestone.specification.features) {
				var f = milestone.specification.features[k];
				if (f.createIssue && f.createIssue == true) {
					var i = iService.newIssue();
					i.title = f.title;
					i.description = "Anforderung\n" + f.requirement + "\n\nUmsetzung:\n" + f.implementation;
					i.milestone = milestone._id;
					i.feature = f._id;
					i.customer = milestone.customer;
					i.issuetype = "FEATURE";
					f.createIssue = false;
					iService.createIssue(i);
				}
			}
			
			var p = $http.put(ProJack.config.dbUrl + "/" + milestone._id, milestone)
				.then(function(response) {
					return response.data;
				});
			return p;
		},
	
		/**
		 * Returns a promise deleting a persisted milestone
		 */
		deleteMilestone : function(milestone) {
			var p = $http({
				method : 'DELETE',
				url    : ProJack.config.dbUrl + "/" + milestone._id + "?rev=" + milestone._rev
			});
			return p;
		},
	
		addAttachment : function(milestone, file) {
			if (!milestone._attachments)
				milestone._attachments = {};
			
			milestone._attachments[file.name] = {};
			milestone._attachments[file.name]['content_type'] = file.type;
			milestone._attachments[file.name]['data'] = file.data;
			return $http.post(ProJack.config.dbUrl, milestone).then(function(response) {
				return response.data;
			});
		},
		
		printMilestone : function(milestone, template) {
			var that = this;
			$http({ 
				method : 'GET',
				url    : ProJack.config.dbUrl + "/" + template._id + "?attachments=true",
				headers : {'Accept' : 'application/json'}
			
			}).then(function(response) {
				var name = undefined;
				for (var i in response.data._attachments) {
					name = i;
					break;
				}
				var post = {
					template : response.data._attachments[i].data,
					model    : JSON.stringify(milestone),
					filename : milestone.name + ".pdf"
				}
				$http.post(ProJack.config.serviceUrl + "/reports", post).success(function(data) {
					that.addAttachment(milestone, { name : milestone.name + ".pdf", type : "application/pdf", data : data });
				});
			});
		}
	};
}]);

ProJack.milestones.controller('MileStonesController', ['$http', '$scope', 'MilestoneService',
	function($http, $scope, service) {
	
	service.getAllMilestones().then(function(data) {
		$scope.milestones = data;
	});
}]);

ProJack.milestones.controller('MileStonesCreateController', ['$http', '$scope', '$location', 'KT', 'MilestoneService', 'CustomerService',
	function($http, $scope, $location, KT, service, customerService) {

	$scope.milestone = service.newMilestone();

	customerService.getAllCustomers().then(function(data) {
		$scope.customers = data;
	});
	
	$scope.saveMilestone = function() {
		service.createMilestone($scope.milestone).then(function(data) {
			KT.alert("Der Milestone wurde erfolgreich angelegt", 'success');
			$location.path("/milestones/" + data.id + "/edit");
		});
	};
}]);

ProJack.milestones.controller('MileStonesEditController', ['$http', '$scope', '$routeParams', 'KT', 'MilestoneService', 'CustomerService', 'IssueService', 
	function($http, $scope, $routeParams, KT, service, customerService, issueService) {

	$scope.tab = 'MILESTONE';
	$scope.template = { _id : undefined };
	
	customerService.getAllCustomers().then(function(data) {
		$scope.customers = data;

		service.getMilestoneById($routeParams.id).then(function(data) {
			$scope.milestone = data;
			
			if ($scope.milestone.plannedReleaseDate.length > 0) {
				$scope.milestone.plannedReleaseDate = new Date($scope.milestone.plannedReleaseDate);
			}
			
			if ($scope.milestone.actualReleaseDate.length > 0) {
				$scope.milestone.actualReleaseDate = new Date($scope.milestone.actualReleaseDate);
			}
			
			// select the correct customer. This needs to be done for the select to work
			for (var i in $scope.customers) {
				if ($scope.customers[i]._id == $scope.milestone.customer._id) {
					$scope.milestone.customer = $scope.customers[i];
					break;
				}
			}
		});
	});
	
	$scope.updateMilestone = function() {
		service.updateMilestone($scope.milestone).then(function() {
			KT.alert("Alle Änderungen gespeichert");
		});
	};
	
	$scope.addAuthor = function() {
		$scope.milestone.specification.authors.push("");
	};
	
	$scope.focusFeature = function(feature) {
		$scope.focusedFeature = feature;
	};
	
	$scope.unfocusFeature = function() {
		$scope.focusedFeature = undefined;
	};
	
	$scope.removeFeature = function(feature) {
		$scope.unfocusFeature();
		KT.remove('_id', feature._id, $scope.milestone.specification.features);
	};
	
	$scope.addFeature = function() {
		$scope.focusedFeature = service.newFeature();
		$scope.milestone.specification.features.push($scope.focusedFeature);
	};
	
	$scope.printMilestone = function() {
		service.printMilestone($scope.milestone, $scope.template);
	};
	
	$scope.downloadAttachment = function(a) {
		window.open(ProJack.config.dbUrl + "/" + $scope.milestone._id + "/" + a.name, '_blank');
	};
}]);
