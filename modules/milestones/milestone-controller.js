ProJack.milestones.controller('MileStonesController', ['$http', '$scope', 'MilestoneService', 'KT',
	function($http, $scope, service, KT) {
	
	service.getAllMilestones().then(function(data) {
		$scope.milestones = data;
	});
	
	$scope.deleteMilestone = function(milestone) {
		KT.confirm("Soll der Milestone wirklich entfernt werden?", function() {
			service.deleteMilestone(milestone).then(function() {
				KT.remove('_id', milestone._id, $scope.milestones);
				KT.alert("Der Milestone wurde entfernt");
			});
		});
	};
	
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
			
			service.getAggregation($scope.milestone).then(function(aggr) {
				$scope.aggregation = aggr;
			});
		
			if ($scope.milestone.plannedApprovalDate.length > 0) {
				$scope.milestone.plannedApprovalDate = new Date($scope.milestone.plannedApprovalDate);
			}
			 
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
		service.updateMilestone($scope.milestone).then(function(data) {
			KT.alert("Alle Änderungen gespeichert");
			service.getAggregation($scope.milestone).then(function(aggr) {
				$scope.aggregation = aggr;
			});
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
		service.printMilestone($scope.milestone, $scope.template).then(function() {
			KT.alert("Das Pflichtenheft wurde erfolgreich angelegt");
		});
	};
	
	$scope.downloadAttachment = function(a) {
		window.open(ProJack.config.dbUrl + "/" + $scope.milestone._id + "/" + a.name, '_blank');
	};
}]);
