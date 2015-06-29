ProJack.issues.controller('IssueIndexController', ['$scope', 'KT', 'IssueService', 'CustomerService', 'SecurityService', '$modal',
                                                   function($scope, KT, service, customerService, secService, $modal) {

	var locKey = "__IssuesIndex_Criteria";
	var sortKey= "__IssuesIndex_SortCriteria";
	var user   = secService.getCurrentUserName();
	
	$scope.criteria = {
		type   : '',
		selection : 0,
		status : 'NEW',
		customer : '',
		status : ''
	};
	
	$scope.predicate = '';
	$scope.reverse   = false;
	
	if (localStorage.getItem(locKey))
		$scope.criteria = JSON.parse(localStorage.getItem(locKey));
	
	if (localStorage.getItem(sortKey)) {
		var x = JSON.parse(localStorage.getItem(sortKey));
		$scope.predicate = x.predicate;
		$scope.reverse   = x.reverse;
	}
	
	customerService.getAllCustomers().then(function(data) {
		$scope.customers = data;
		
		if ($scope.criteria.customer == '') {
			$scope.criteria.customer = data[0]._id;
		}
	});

    // load all observed issues
    service.getObservedIssues().then(function(issues) {
       $scope.observedIssues = issues;
    });
	
	$scope.$watch('criteria', function() {
		localStorage.setItem(locKey, JSON.stringify($scope.criteria));
		service.getIssuesByCriteria($scope.criteria).then(function(data) {
			$scope.issues = data;
		});
	}, true);
	
	$scope.$watch('predicate', function() {
		var x = { predicate : $scope.predicate, reverse : $scope.reverse };
		localStorage.setItem(sortKey, JSON.stringify(x));
	});

	$scope.isObserving = function(issue) {
       if (!issue.observers) return false;
       return (issue.observers.indexOf(user) > -1);
	};

	$scope.toggleObservation = function(issue) {
       service.toggleObservation(issue);
	};
}]);

ProJack.issues.controller('IssueTimeTrackModalController', ['$scope', '$modalInstance', 'KT', 'IssueService', 'data', function($scope, $modalInstance, KT, service, data) {

	$scope.issue = data.issue;
	$scope.user  = data.user;
	$scope.endTime = new Date().getTime();
	$scope.tinyOptions = ProJack.config.tinyOptions;

	$scope.note = service.newNote();
	
	// find the tracking for the given user
	var t = service.getCurrentTimeTrackingData($scope.issue);
	
	$scope.startTime = t.startTime;
	$scope.endTime = t.endTime;
	$scope.pauseTime = t.pauseTime;
	$scope.result = t.result;
	$scope.note.timeSpent = t.result;
	
	$scope.ok = function() {
		
		// remove tracking information
		service.removeTrackingData($scope.issue);
		
		// add the note to the issue
		$scope.issue.notes.push($scope.note);
		
		// update the issue using the service
		service.updateIssue($scope.issue).then(function(data) {
			$scope.issue._rev = data.rev;
			KT.alert('Notiz wurde erfolgreich hinzugefügt');
			$modalInstance.close();
		});
	};
	
	$scope.cancel = function() {
		$modalInstance.dismiss();
	};
}]);

ProJack.issues.controller('IssueResolveModalController', ['$scope', '$modalInstance', 'IssueService', 'CustomerService', 'GitlabService', 'data', 
                                                          function($scope, $modalInstance, service, cService, glService, data) {

	$scope.issue = data.issue;
	$scope.branches = [];
	$scope.tinyOptions = ProJack.config.tinyOptions;
	$scope.tinyOptions.height = '200px';
	
	cService.getCustomerById($scope.issue.customer).then(function(customer) {
		if (customer.gitlabProject) {
			glService.getBranchesByProjectId(customer.gitlabProject).then(function(branches) {
				for (var q in branches) 
					$scope.branches.push(branches[q].name);
			});
		}
	});

	$scope.addNote = function() {
		$scope.note = service.newNote();
	};
	
	$scope.toggleBranch = function(branch) {
		// support legacy issues not having a fixedIn property
		if (!$scope.issue.fixedIn)
			$scope.issue.fixedIn = [];
		
		var idx = $scope.issue.fixedIn.indexOf(branch);
		if (idx > -1) {
			$scope.issue.fixedIn.splice(idx,1);
		} else {
			$scope.issue.fixedIn.push(branch);
		}
	};
	
	
	$scope.save = function() {
		if ($scope.note) 
			$scope.issue.notes.push($scope.note);
		
		service.updateIssue($scope.issue).then(function() {
			$modalInstance.close();
		});
	};
	
	$scope.dismiss = function() {
		$modalInstance.dismiss();
	};
}]);


ProJack.issues.controller('IssueCreateController', ['$scope', '$location', '$routeParams', 'KT', 'IssueService', 'CustomerService', 
                                                    function($scope, $location, $routeParams, KT, service, customerService) {
	
	$scope.issue = service.newIssue();
	$scope.tinymceOptions = ProJack.config.tinyOptions;
	
	customerService.getAllCustomers().then(function(data) {
		$scope.customers = data;
		if ($routeParams.cid) {
			for (var i in $scope.customers) {
				if ($scope.customers[i]._id == $routeParams.cid) {
					$scope.issue.customer = $scope.customers[i]._id;
					break;
				}
			}
		}
	});
	
	$scope.createIssue = function() {
		service.createIssue($scope.issue).then(function() {
			KT.alert("Das Issue wurde erfolgreich angelegt");
			$location.path("/issues");
		});
	};
}]);


ProJack.issues.controller('IssueModifyController', 
		['$scope', '$routeParams', '$location', 'KT', 'IssueService', 'CustomerService', 
		 function($scope, $routeParams, $location, KT, service, cService) {
	
	$scope.tinymceOptions = ProJack.config.tinyOptions;
	
	cService.getAllCustomers().then(function(customers) {
		$scope.customers = customers;
		service.getIssueById($routeParams.id).then(function(issue) {
			$scope.issue = issue;
		});
	});
	
	$scope.updateIssue = function() {
		service.updateIssue($scope.issue).then(function(data) {
			$scope.issue._rev = data.rev;
			KT.alert('Das Issue wurde erfolgreich gespeichert');
			$location.path('#/issues');
		});
	};
}]);


ProJack.issues.controller('IssueChangelogController', ['$scope', 'CustomerService', 'IssueService', function($scope, CustomerService, IssueService) {

	
	if (localStorage.getItem("__Projack_Changelog_Criteria")) {
		var x = JSON.parse(localStorage.getItem("__Projack_Changelog_Criteria"));
		$scope.criteria = {
				customer : x.customer,
				from     : new Date(x.from),
				to		 : new Date(x.to)
		};
	} else {
		$scope.criteria = {
			from : new Date(),
			to   : new Date(),
			customer : ''
		};
	}
	
	CustomerService.getAllCustomers().then(function(data) {
		$scope.customers = data;
	});
	
	$scope.$watch('criteria', function(val) {
		if (!$scope.criteria.customer || !$scope.criteria.from || !$scope.criteria.to) return;
		
		IssueService.getChangelog($scope.criteria.customer, $scope.criteria.from, $scope.criteria.to).then(function(issues) {
			$scope.issues = issues;
		});
		
		localStorage.setItem("__Projack_Changelog_Criteria", JSON.stringify($scope.criteria));
	}, true);
}]);


ProJack.issues.controller('IssueOverlayController', ['$scope', 'IssueService', 'CustomerService', 
                                                     function($scope, service, customerService) {
	
	$scope.issues = [];
	$scope.customers = [];

	$scope.criteria = {
			status		: 1,
			customer	: undefined
	};
	
	customerService.getAllCustomers().then(function(data) {
		$scope.customers = data;
	});
}]);


ProJack.issues.controller('IssueEditController', 
		['$scope', '$routeParams', '$location', 'KT', 'IssueService', 'CustomerService', 'SecurityService', 'GitlabService', '$sce',
        function($scope, $routeParams, $location, KT, service, customerService, secService, glService, $sce) {
	
	$scope.html = { description : '', notes : {} };
	$scope.tinyOptions = ProJack.config.tinyOptions;
	
	// the time spent on this issue when tracking is active
	$scope.currentSpent = 0;

    $scope.user = secService.getCurrentUserName();
	
	// the current display mode
	$scope.viewMode = 'DISPLAY';
	
	$scope.branches = [];
	
	var timeIval = undefined;
	
	// indicates whether or not to remove the users time tracking when
	// the issue is updated.
	// This will be set to true, when the user stops tracking and posts
	// the actual note.
	// This should be initially set to false, in order to allow adding notes
	// when tracking is active without removing the tracking data
	$scope.removeTrackingOnUpdate = false;
	
	
	// load the issue to be displayed
	service.getIssueById($routeParams.id).then(function(data) {
		$scope.issue = data;
		$scope.timeOnIssue = service.calculateTimeOnIssue($scope.issue);
		$scope.sanitizeHtml();

		// load the customer if the issue has one
		customerService.getCustomerById($scope.issue.customer).then(function(data) {
			$scope.customer = data;

			// the branches
			if ($scope.customer.gitlabProject) {
				glService.getBranchesByProjectId($scope.customer.gitlabProject).then(function(data) {
					$scope.branches = [];
					for (var i in data) {
						$scope.branches.push(data[i].name);
					}
				});
			}
		});
	
		// check if there is active time tracking. If so set an interval to calculate the current ticket time
		$scope.setTicketTimeInterval();
	});

	/**
	 * Sets an interval to display the current tracking time
	 */
	$scope.setTicketTimeInterval = function() {
		if (service.hasActiveTracking($scope.issue)) {
			$scope.currentSpent = service.getCurrentTimeTrackingData($scope.issue).result;
			
			timeIval = window.setInterval(function() {
				var d = service.getCurrentTimeTrackingData($scope.issue).result;
				
				$scope.$apply(function() {
					$scope.currentSpent = d;
				});
			}, 30000);
		}	
	};
	
	$scope.sanitizeHtml = function() {
		// add $sce for all notes
		for (var i in $scope.issue.notes) {
			var n = $scope.issue.notes[i];
			$scope.html.notes[n._id] = $sce.trustAsHtml(n.text);
		}
		$scope.html.description = $sce.trustAsHtml($scope.issue.description.replace(/\n/g, '<br/>'));
	};
	
	$scope.addNote = function() {
		$scope.note = service.newNote();
	};
	
	$scope.unfocusNote = function() {
		$scope.note = undefined;
	};
	
	$scope.focusNote = function(n) {
		$scope.note = n;
		$scope.note.userModified = secService.getCurrentUserName();
	};
	
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
	
	
	$scope.editIssue = function() {
		$scope.viewMode = 'EDIT';
	};
	
	$scope.cancelEdit = function() {
		$scope.viewMode = 'DISPLAY';
	};
	
	$scope.updateIssue = function(redirect) {
		if ($scope.note) {
			KT.remove('_id', $scope.note._id, $scope.issue.notes);
			$scope.issue.notes.push($scope.note);
		}
		
		// unset the note
		$scope.note = undefined;
		
		// remove tracking data if required
		if ($scope.removeTrackingOnUpdate) {
			service.removeTrackingData($scope.issue);
			window.clearInterval(timeIval);
			$scope.currentSpent = 0;
		}
	
		service.updateIssue($scope.issue).then(function(data) {
			$scope.issue._rev = data.rev;
			$scope.timeOnIssue = service.calculateTimeOnIssue($scope.issue);
			$scope.sanitizeHtml();
			KT.alert("Notiz gespeichert");
			$scope.removeTrackingData = false;
			if (redirect) 
				$location.path('/issues');
		});
	};

	
	$scope.toggleBranch = function(branch) {
		// support legacy issues not having a fixedIn property
		if (!$scope.issue.fixedIn)
			$scope.issue.fixedIn = [];
		
		var idx = $scope.issue.fixedIn.indexOf(branch);
		if (idx > -1) {
			$scope.issue.fixedIn.splice(idx,1);
		} else {
			$scope.issue.fixedIn.push(branch);
		}
	};

	$scope.$on('trackingStopped', function(event, data) {
		if ($scope.note) {
			KT.confirm('Achtung! Wenn Sie fortfahren wird die aktuelle Notiz verworfen! Weiter?', function() {
				$scope.unfocusNote();
				$scope.addNoteFromTracking();
			});
		} else {
			$scope.addNoteFromTracking();
		}
	});

	/**
	 * Starts or resumes time tracking for the current user on the given issue
	 */
	$scope.$on('trackingStarted', function(event, data) {
		service.startTimeTracking($scope.issue).then(function() {
			$scope.setTicketTimeInterval();
		});
	});
	

	$scope.addNoteFromTracking = function() {
		var data = service.getCurrentTimeTrackingData($scope.issue);
		$scope.note = service.newNote();
		$scope.note.timeSpent = data.result;
		$scope.removeTrackingOnUpdate = true;
	};

    $scope.isObserving = function() {
        if (!$scope.issue || !$scope.issue.observers) return false;
        return $scope.issue.observers.indexOf($scope.user) > -1;
    };

    $scope.toggleObservation = function() {
      service.toggleObservation($scope.issue);
    };
}]);