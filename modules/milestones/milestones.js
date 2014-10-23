ProJack.milestones = angular.module('MileStonesModule', ['Utils', 'CustomersModule']);

ProJack.milestones.service("MilestoneService", ['$http', 'KT', function($http, KT) {
	
	return {
		
		/**
		 * Creates a new milestone and initializes it with sane values
		 */
		newMilestone: function() {
			return {
				_type 				: 'milestone',
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
			var p = $http.get(ProJack.config.dbUrl + '/_design/milestones/_view/byCustomer?key=\"'+customer_.id+'\"')
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
					return response.data;
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
		}
	};
}]);

ProJack.milestones.controller('MileStonesController', ['$http', '$scope', 'MilestoneService',
	function($http, $scope, service) {
	
	service.getAllMilestones().then(function(data) {
		$scope.milestones = data;
	});
}]);

ProJack.milestones.controller('MileStonesCreateController', ['$http', '$scope', '$location', 'MilestoneService', 'CustomerService',
	function($http, $scope, $location, service, customerService) {

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

ProJack.milestones.controller('MileStonesEditController', ['$http', '$scope', '$routeParams', 'KT', 'MilestoneService', 'CustomerService', 
	function($http, $scope, $routeParams, KT, service, customerService) {

	$scope.tab = 'MILESTONE';
	
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
}]);
