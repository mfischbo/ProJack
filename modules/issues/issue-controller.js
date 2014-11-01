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
		milestoneService.getMilestonesByCustomer(
				KT.find("_id", $scope.criteria.customer, $scope.customers)).then(function(stones) {
			if (!$scope.milestones) 
				$scope.milestones = [{ version : 'Alle Versionen', _id : "" }];
			$scope.milestones = $scope.milestones.concat(stones);
		})
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
		});
	}, true);
	
}]);

ProJack.issues.controller('IssueCreateController', ['$scope', '$location', 'KT', 'IssueService', 'CustomerService', 'MilestoneService', 
                                                    function($scope, $location, KT, service, customerService, milestoneService) {
	
	$scope.issue = service.newIssue();
	$scope.tinymceOptions = {
			menu : {}
	};
	
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

ProJack.issues.controller('IssueEditController', 
		['$scope', '$routeParams', 'KT', 'IssueService', 'CustomerService', 'MilestoneService', 'SecurityService', '$upload', '$sce',
        function($scope, $routeParams, KT, service, customerService, milestoneService, secService, $upload, $sce) {
	
	$scope.time = { spent : '' };
	$scope.html = { description : '', notes : {} };
	$scope.tinyOptions = ProJack.config.tinyOptions;
	
	service.getIssueById($routeParams.id).then(function(data) {
		$scope.issue = data;
		$scope.timeOnIssue = service.calculateTimeOnIssue($scope.issue);
		$scope.sanitizeHtml();
	
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
	
	$scope.sanitizeHtml = function() {
		// add $sce for all notes
		for (var i in $scope.issue.notes) {
			var n = $scope.issue.notes[i];
			$scope.html.notes[n._id] = $sce.trustAsHtml(n.text);
		}
		$scope.html.description = $sce.trustAsHtml($scope.issue.description.replace(/\n/g, '<br/>'));
	}
	
	$scope.addNote = function() {
		$scope.note = service.newNote();
	};
	
	$scope.unfocusNote = function() {
		$scope.note = undefined;
		$scope.time.spent = "";
	};
	
	$scope.focusNote = function(n) {
		$scope.note = n;
		$scope.note.userModified = secService.getCurrentUserName();
		$scope.time.spent = n.timeSpentHours + ":" + n.timeSpentMinutes;
	}
	
	$scope.deleteNote = function(n) {
		KT.remove('_id', n._id, $scope.issue.notes);
		$scope.updateIssue();
	};
	
	$scope.onAttachmentSelect = function($files) {
		var p = service.addAttachment($scope.issue, $files[0]);
		p.then(function(data) {
			if (!$scope.issue.attachments)
				$scope.issue.attachments = [];
			$scope.issue.attachments.push(data);
			KT.alert("Upload erfolgreich");
		});
	};
	
	$scope.downloadAttachment = function(a) {
		window.open(ProJack.config.dbUrl + "/" + $scope.issue._id + "/" + a.filename, '_blank');
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
			$scope.sanitizeHtml();
			KT.alert("Notiz gespeichert");
		});
	};
}]);