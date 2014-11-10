ProJack.issues.controller('IssueIndexController', ['$scope', 'KT', 'IssueService', 'CustomerService', 'MilestoneService', 'SecurityService', '$modal',
                                                   function($scope, KT, service, customerService, milestoneService, secService, $modal) {

	var locKey = "__IssuesIndex_Criteria";
	var user   = secService.getCurrentUserName();
	
	$scope.criteria = {
		type   : '',
		selection : 0,
		status : 'NEW',
		customer : '',
		milestone :'',
		status : ''
	};
	
	if (localStorage.getItem(locKey)) {
		$scope.criteria = JSON.parse(localStorage.getItem(locKey));
	}
	
	customerService.getAllCustomers().then(function(data) {
		$scope.customers = data;
		
		if ($scope.criteria.customer == '') {
			$scope.criteria.customer = data[0]._id;
		}
		
		milestoneService.getMilestonesByCustomer(
				KT.find("_id", $scope.criteria.customer, $scope.customers)).then(function(stones) {
			if (!$scope.milestones)
				$scope.milestones = [];
			
			$scope.milestones.push({version : 'Alle Versionen', _id : ''});
			$scope.milestones.push({version : 'Ohne Milestone', _id : ProJack.config.lowId});
			$scope.milestones = $scope.milestones.concat(stones);
			if ($scope.criteria.milestone == '')
				$scope.criteria.milestone = $scope.milestones[0]._id;
		})
	});
	
	$scope.$watch('criteria.customer', function(val) {
		if (!val || val.length == 0) return;
		if (!$scope.customers || $scope.customers.length == 0) return;
		
		milestoneService.getMilestonesByCustomer(KT.find('_id', val, $scope.customers))
			.then(function(data) {
				$scope.milestones = [];
				$scope.milestones.push({ version : 'Alle Versionen', _id : '' });
				$scope.milestones.push({version : 'Ohne Milestone', _id : ProJack.config.lowId});
			
				$scope.milestones = $scope.milestones.concat(data);
				if ($scope.milestones.length == 1) {
					$scope.criteria.milestone = $scope.milestones[0]._id;
				}
			});
	});
	
	$scope.$watch('criteria', function() {
		localStorage.setItem(locKey, JSON.stringify($scope.criteria));
		service.getIssuesByCriteria($scope.criteria).then(function(data) {
			$scope.issues = data;
		});
	}, true);
	
	
	/**
	 * Returns whether or not the user is able to start time tracking on this issue
	 */
	$scope.isTimeStartable = function(issue) {
		return service.isTimeStartable(issue);
	};


	/**
	 * Returns whether or not the user is able to pause the time tracking on this issue
	 */
	$scope.isTimePauseable = function(issue) {
		return service.isTimePauseable(issue);
	};
	
	/**
	 * Returns whether or not the user is able to resume time tracking on this issue
	 */	
	$scope.isTimeResumable = function(issue) {
		return service.isTimeResumable(issue);

	};
	
	/**
	 * Returns whether or not the user is able to stop time tracking on the given issue
	 */
	$scope.isTimeStoppable = function(issue) {
		return service.isTimePauseable(issue);
	};

	/**
	 * Starts or resumes time tracking for the current user on the given issue
	 */
	$scope.startTimeTracking = function(issue) {
		service.startTimeTracking(issue);
	};
	
	/**
	 * Pauses time tracking for the current user on the given issue
	 */
	$scope.pauseTimeTracking = function(issue) {
		service.pauseTimeTracking(issue);
	};
	
	/**
	 * Stops time tracking for the current user on the given issue and opens
	 * a modal dialog in order to leave a note for the tracking
	 */
	$scope.stopTimeTracking = function(issue) {
		$modal.open({
			controller		: 'IssueTimeTrackModalController',
			templateUrl 	: './modules/issues/views/timetrack-modal.html',
			size			: 'lg',
			resolve : {
				data : function() {
					return { user : user, issue : issue };
				}
			}
		});
	};
	
}]);

ProJack.issues.controller('IssueTimeTrackModalController', ['$scope', '$modalInstance', 'KT', 'IssueService', 'data', function($scope, $modalInstance, KT, service, data) {

	$scope.issue = data.issue;
	$scope.user  = data.user;
	$scope.endTime = new Date().getTime();

	$scope.note = service.newNote();
	
	// find the tracking for the given user
	var t = service.getCurrentTimeTrackingData($scope.issue);
	
	$scope.startTime = t.startTime;
	$scope.endTime = t.endTime;
	$scope.pauseTime = t.pauseTime;
	$scope.result = t.result;
	$scope.time = { spent : t.time };
	
	$scope.ok = function() {
		
		// remove tracking information
		service.removeTrackingData($scope.issue);
		
		// calculate the spent time for the note
		var t = $scope.time.spent.split(":");
		$scope.note.timeSpentHours = parseInt(t[0]);
		$scope.note.timeSpentMinutes = parseInt(t[1]);
		
		// add the note to the issue
		$scope.issue.notes.push($scope.note);
		
		// update the issue using the service
		service.updateIssue($scope.issue).then(function(data) {
			$scope.issue._rev = data.rev;
			KT.alert('Notiz wurde erfolgreich hinzugefügt');
			$modalInstance.close();
		});
	}
	
	$scope.cancel = function() {
		$modalInstance.dismiss();
	}
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
				$scope.milestones = [{ version : 'Ohne Milestone', _id : ProJack.config.lowId }];
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
		});

		// load the milestone if the issue has one
		if ($scope.issue.milestone != ProJack.config.lowId) {
			milestoneService.getMilestoneById($scope.issue.milestone).then(function(data) {
				$scope.milestone = data;
				if ($scope.issue.feature && $scope.issue.feature != "") {
					$scope.feature = KT.find("_id", $scope.issue.feature, $scope.milestone.specification.features);
				}
			});
		}
		
		// check if there is active time tracking. If so set an interval to calculate the current ticket time
		$scope.setTicketTimeInterval();
	});

	/**
	 * Sets an interval to display the current tracking time
	 */
	$scope.setTicketTimeInterval = function() {
		if (service.hasActiveTracking($scope.issue)) {
			$scope.time.currentSpent = service.getCurrentTimeTrackingData($scope.issue).time;
			
			timeIval = window.setInterval(function() {
				var d = service.getCurrentTimeTrackingData($scope.issue);
				console.log(d);
				$scope.$apply(function() {
					$scope.time.currentSpent = d.time;
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
	
		// unset the note
		$scope.note = undefined;
		$scope.time.spent = "";
		
		// remove tracking data if required
		if ($scope.removeTrackingOnUpdate) {
			service.removeTrackingData($scope.issue);
			window.clearInterval(timeIval);
			$scope.time.currentSpent = '00:00';
		}
	
		service.updateIssue($scope.issue).then(function(data) {
			$scope.issue._rev = data.rev;
			$scope.timeOnIssue = service.calculateTimeOnIssue($scope.issue);
			$scope.sanitizeHtml();
			KT.alert("Notiz gespeichert");
		
			$scope.removeTrackingData = false;
		});
	};

	
	/**
	 * Returns whether or not the user is able to start time tracking on this issue
	 */
	$scope.isTimeStartable = function() {
		if (!$scope.issue) return false;
		return service.isTimeStartable($scope.issue);
	};


	/**
	 * Returns whether or not the user is able to pause the time tracking on this issue
	 */
	$scope.isTimePauseable = function() {
		if (!$scope.issue) return false;
		return service.isTimePauseable($scope.issue);
	};
	
	/**
	 * Returns whether or not the user is able to resume time tracking on this issue
	 */	
	$scope.isTimeResumable = function() {
		if (!$scope.issue) return false;
		return service.isTimeResumable($scope.issue);
	};
	
	/**
	 * Returns whether or not the user is able to stop time tracking on the given issue
	 */
	$scope.isTimeStoppable = function() {
		if (!$scope.issue) return false;
		return service.isTimePauseable($scope.issue);
	};

	/**
	 * Starts or resumes time tracking for the current user on the given issue
	 */
	$scope.startTimeTracking = function() {
		service.startTimeTracking($scope.issue).then(function() {
			$scope.setTicketTimeInterval();
		});
	};
	
	/**
	 * Pauses time tracking for the current user on the given issue
	 */
	$scope.pauseTimeTracking = function() {
		service.pauseTimeTracking($scope.issue);
	};
	
	/**
	 * Stops time tracking for the current user on the given issue and opens
	 * a modal dialog in order to leave a note for the tracking
	 */
	$scope.stopTimeTracking = function() {
		
		if ($scope.note) {
			KT.confirm('Achtung! Wenn Sie fortfahren wird die aktuelle Notiz verworfen! Weiter?', function() {
				$scope.unfocusNote();
				$scope.addNoteFromTracking();
			});
		} else {
			$scope.addNoteFromTracking();
		}
	};
	
	$scope.addNoteFromTracking = function() {
		var data = service.getCurrentTimeTrackingData($scope.issue);
		$scope.time.spent = data.time;
		$scope.note = service.newNote();
		$scope.removeTrackingOnUpdate = true;
	};
}]);