ProJack.sprint.controller('SprintIndexController', ['$scope', 'KT', 'SprintService', 'IssueService', 'CustomerService', 'SecurityService', '$uibModal',
                                                    function($scope, KT, service, iService, cService, secService, $modal) {

	var locKey = '__ProJack.sprints.current.id';
	
	// All future sprints and the current sprint
	$scope.sprints = [];
	$scope.sprint = {};

	// States if the issue overlay is visible
	$scope.issueOverlayVisible = false;
	$scope.issueCreateOverlayVisible = false;
	$scope.tinymceOptions = ProJack.config.tinyOptions;
	
	// issue to be created from the overlay
	$scope.issue 	  = iService.newIssue();

	$scope.unassignedVisible = 'ALL';
	$scope.progressVisible = 'ALL';		// or OWN to display only issues assigned to current user
	$scope.currentUserName = secService.getCurrentUserName();

	// load the all future sprints and take the closest release as the current
	var m = moment();
	m.subtract(1, 'months');
	service.getSprintsStartingAt(m.toDate()).then(function(data) {
		$scope.sprints = data;
		if (localStorage.getItem(locKey)) {
			var current = localStorage.getItem(locKey);
			for (var i in $scope.sprints)
				if ($scope.sprints[i]._id == current)
					$scope.sprint = $scope.sprints[i];
		} else {
			$scope.sprint = data[0];
		}
	
		// run the initialization for the current sprint
		$scope.initializeSprint();
	});

	$scope.initializeSwimlanes = function() {
		// add lanes array for backward compatibility
		if ($scope.sprint.lanes == undefined || $scope.sprint.lanes.length == 0) {
			$scope.sprint.lanes = [];
			$scope.defaultLane = service.newSwimlane(false);
			$scope.sprint.lanes.push($scope.defaultLane);
		} else {
			if ($scope.defaultLane !== undefined)
				return;
			
			for (var i in $scope.sprint.lanes) {
				if ($scope.sprint.lanes[i].isModifieable == false) 
					$scope.defaultLane = $scope.sprint.lanes[i];
			}
		}
	};
	
	/**
	 * Loads all tickets for the given sprint and sorts it in the lanes
	 */
	$scope.initializeSprint = function() {
		// update the empty issue
		$scope.issue.resolveUntil = $scope.sprint.releaseAt;
		
		// create the swimlanes
		$scope.initializeSwimlanes();

		$scope.issueCnt   = 0;
		//$scope.lanes = [ $scope.unassigned, $scope.inProgress, $scope.qa, $scope.done ];
	
		// load all related issues and sort them
		iService.getIssuesBySprint($scope.sprint).then(function(data) {
			$scope.issues = data;
			
			// sort issues into specified lanes
			for (var i in $scope.issues) {
				var sorted = false;

				for (var q in $scope.sprint.lanes) {
					var idx = KT.indexOf('_id', $scope.issues[i]._id, $scope.sprint.lanes[q].issues);
					if (idx >= 0) {
						$scope.sprint.lanes[q].issues[idx] = $scope.issues[i];
						sorted = true;
					}
				}
				if (!sorted)
					$scope.defaultLane.issues.push($scope.issues[i]);
			}
			
			// notify lanes directives
			$scope.$broadcast('issuesReloaded');
			$scope.issueCnt = data.length;
		});
	};
	
	$scope.addSwimlane = function() {
		$scope.sprint.lanes.push(service.newSwimlane(true));
		service.saveSprint($scope.sprint).then(function(sprint) {
			$scope.sprint = sprint;
		});
	};

	/*
	$scope.runPoll = function() {
		service.pollChanges($scope.sprint).then(function(data) {
			$scope.updateSprintView(data);
		});
	};
	*/

	/*
	$scope.updateSprintView = function(revs) {
		if (!revs.newDoc || !revs.oldDoc)
			return $scope.runPoll();
		
		var nRev = revs.newDoc;
		var oRev = revs.oldDoc;
		
		// check if we already have the current revision. If so, ignore the change,
		// since the UI is already up to date
		for (var x in $scope.lanes) {
			var aIssue = KT.find('_id', nRev._id, $scope.lanes[x]);
			if (aIssue && aIssue._rev == nRev._rev) {
				return $scope.runPoll();
			}
		}
			
		// no sprint set on oRev but on nRev -> move to assigned lane
		if ((!oRev.sprint || oRev.sprint.length == 0) && nRev.sprint.length > 0) {
			$scope.onUnassignedDrop($event, nRev, true);
			return $scope.runPoll();
		}
			
		// no sprint set on nRev but on oRev -> move to backlog
		if ((!nRev.sprint || nRev.sprint.length == 0) && oRev.sprint.length > 0) {
			for (var q in $scope.lanes)
				KT.remove('_id', nRev._id, $scope.lanes[q]);
			return $scope.runPoll();
		}
		
		// no changes in states. Just update the issue
		if (nRev.state == oRev.state) {
			for (var q in $scope.lanes) {
				if (KT.indexOf('_id', oRev._id, $scope.lanes[q]) > -1) {
					KT.remove('_id', oRev._id, $scope.lanes[q]);
					$scope.lanes[q].push(nRev);
					return $scope.runPoll();
				}
			}
		}
		
		// state changed to: NEW
		if (nRev.state == 'NEW') {
			$scope.onUnassignedDrop(null, nRev, true);
			return $scope.runPoll();
		}
			
		// state changed to: ASSIGNED || FEEDBACK
		if (nRev.state == 'ASSIGNED' || nRev.state == 'FEEDBACK') {
			$scope.onInProgressDrop(null, nRev, true);
			return $scope.runPoll();
		}
		
		// state changed to: RESOLVED
		if (nRev.state == 'RESOLVED') {
			$scope.onQADrop(null, nRev, true);
			return $scope.runPoll();
		}
		
		// state changed to: CLOSED
		if (nRev.state == 'CLOSED') {
			$scope.onDoneDrop(null, nRev, true);
			return $scope.runPoll();
		}
	};
	*/
	
	
	$scope.switchSprint = function(sprint) {
		$scope.sprint = sprint;
		$scope.initializeSprint();
		localStorage.setItem(locKey, $scope.sprint._id);
	};
	
	
	$scope.toggleIssueOverlay = function() {
		$scope.issueCreateOverlayVisible = false;
		$scope.issueOverlayVisible = !$scope.issueOverlayVisible;
	};
	
	$scope.toggleIssueCreateOverlay = function() {
		$scope.issueOverlayVisible = false;
		$scope.issueCreateOverlayVisible = !$scope.issueCreateOverlayVisible;
	};

	/*
	var checkTracking = function(issue) {
		// disallow to move issues that are currently time tracked
		if (iService.hasActiveTracking(issue)) {
			KT.alert('Timetracking muss gestoppt sein um das Ticket zu bewegen', 'warning');
			return false;
		}
		return true;
	}
	*/
	
	/**
	 * Methods to check whether or not the dropzone accepts the issue
	 */
	/*
	$scope.validateUnassignedDrop = function(issue) {
		if (KT.indexOf('_id', issue._id, $scope.unassigned) >= 0)
			return false;
		if (!checkTracking(issue))
			return false;
		return true;
	};

	$scope.validateInProgressDrop = function(issue) {
		if (KT.indexOf('_id', issue._id, $scope.inProgress) >= 0) 
			return false;
		if (!checkTracking(issue))
			return false;
		return true;
	};
	
	$scope.validateQADrop = function(issue) {
		// disallow droping to itself
		if (KT.indexOf('_id', issue._id, $scope.qa) >= 0)
			return false;
		if (!checkTracking(issue))
			return false;
		return true;
	};
	
	$scope.validateDoneDrop = function(issue) {
		// only allow dropping from QA lane
		if (KT.indexOf('_id', issue._id, $scope.qa) >= 0)
			return true;
		if (!checkTracking(issue))
			return false;
		return false;
	};
	*/
	
	/**
	 * Removes the given issue from the sprint
	 */
	$scope.removeFromSprint = function(issue) {
		/*
		issue.sprint = '';
		iService.updateIssue(issue).then(function() {
			KT.remove('_id', issue._id, $scope.unassigned);
		});
		*/
	};
	
	/**
	 * Handler to be called, when dragging from the issue overlay to the unassigned lane
	 */
	/*
	$scope.onUnassignedDrop = function($event, issue, fromFeed) {
		if (fromFeed) {
			$scope.unassigned.push(issue);
			$scope.removeExcept(issue, $scope.unassigned);
			return;
		}
		if (!issue.sprint || issue.sprint.length == 0) {
			// assign the issue to the current sprint
			issue.sprint = $scope.sprint._id;
			issue.state  = 'NEW';
			iService.updateIssue(issue).then(function(data) {
				KT.remove('_id', issue._id, $scope.issues);
			});
		} else {
			issue.assignedTo = '';
			issue.state      = 'NEW';
			iService.updateIssue(issue).then(function(data) {
				$scope.removeExcept(issue, $scope.unassigned);
			});
		}
		$scope.unassigned.push(issue);
	};
	
	
	/**
	 * Handler to be called when dropping item on the inProgress lane
	 * Issue will be stated to ASSIGNED for the current user, saved and removed from all other lanes
	 */
	/*
	$scope.onInProgressDrop = function($event, issue, fromFeed) {
		if (fromFeed) {
			$scope.inProgress.push(issue);
			$scope.removeExcept(issue, $scope.inProgress);
			return;
		}
		
		// update the issue ... set to assigned and assign the current user
		issue.state = 'ASSIGNED';
		issue.assignedTo = 'org.couchdb.user:' + secService.getCurrentUserName();
		iService.updateIssue(issue).then(function() {
			$scope.removeExcept(issue, $scope.inProgress);
			$scope.inProgress.push(issue);
		});
	};
	
	/**
	 * Handler to be called when dropping item on the QA lane
	 * Issue will be stated as RESOLVED and modal will open to leave notes.
	 * Issue will be saved on modal success.
	 */
	/*
	$scope.onQADrop = function($event, issue, fromFeed) {
		if (fromFeed) {
			$scope.qa.push(issue);
			$scope.removeExcept(issue, $scope.qa);
			return;
		}
		issue.state = 'RESOLVED';
		issue.assignedTo = '';
		var instance = $modal.open({
			controller:		'IssueResolveModalController',
			templateUrl:	'./modules/issues/views/resolve-modal.html',
			size:			'lg',
			resolve: {
				data : function() {
					return { issue : issue }
				}
			}
		});
		instance.result.then(function() {
			$scope.removeExcept(issue, $scope.qa);
			$scope.qa.push(issue);
		});
	};

	
	/**
	 * Handler to be called when issue is dropped on done lane.
	 * Issue will be stated to CLOSED and saved
	 */
	/*
	$scope.onDoneDrop = function($event, issue, fromFeed) {
		if (fromFeed) {
			$scope.done.push(issue);
			$scope.removeExcept(issue, $scope.done);
			return;
		}
		issue.state = 'CLOSED';
		iService.updateIssue(issue).then(function() {
			KT.remove('_id', issue._id, $scope.qa);
			$scope.done.push(issue);
		});
	};

	
	/**
	 * Removes an issue from all lanes except the specified one
	 */
	$scope.removeExcept = function(issue, lane) {
		for (var q in $scope.lanes) {
			if ($scope.lanes[q] != lane) {
				KT.remove('_id', issue._id, $scope.lanes[q]);
			}
		}
	};
	
	/**
	 * Create new issues from the overlay
	 */
	/*
	$scope.createIssue = function() {
		$scope.issue.sprint = $scope.sprint._id;
		iService.createIssue($scope.issue).then(function(data) {
			$scope.unassigned.push(data);
			$scope.issue = iService.newIssue();
			$scope.issue.resolveUntil = $scope.sprint.releaseAt;
			$scope.toggleIssueCreateOverlay();
		});
	};
	*/

	/**
	 * Finalizes the sprint and put's all issues still in the unassigned lane back to the backlog
	 */
	/*
	$scope.finalizeSprint = function() {
		KT.confirm("Soll der Sprint wirklich geschlossen werden?", function() {
			for (var i=$scope.unassigned.length; i > 0; i--) {
				var issue = $scope.unassigned[i-1];
                issue.sprint = "";
                iService.updateIssue(issue).then(function(data) {
                	$scope.unassigned.splice(i-1, 1);
                });
			}
		});
	};
	*/
	
	/**
	 * Issue overlay controller. Must stay here for drag/drop to work properly 
	 */
	$scope.issues = [];
	$scope.customers = [];

	$scope.criteria = {
			status		: 1,
			customer	: undefined
	};
	if (localStorage.getItem('__ProJack.Sprint.IssueOverlay.criteria') != undefined) {
		$scope.criteria = JSON.parse(localStorage.getItem('__ProJack.Sprint.IssueOverlay.criteria'));
	}
	
	cService.getAllCustomers().then(function(data) {
		$scope.customers = data;
		$scope.criteria.customer = data[0];
	});

	$scope.$watch('criteria.customer', function(val) {
		if (!$scope.criteria.customer) return;
		var criteria = {
			customer : $scope.criteria.customer._id,
			status   : 1
		};
		iService.getIssuesByCriteria(criteria).then(function(data) {
			$scope.issues = data;
		});
		localStorage.setItem('__ProJack.Sprint.IssueOverlay.criteria', JSON.stringify($scope.criteria));
	});

	$scope.$watch('issueOverlayVisible', function(nval, oval) {
		if (nval) {
			var criteria = {
					customer : $scope.criteria.customer._id,
					status   : 1
			};
			iService.getIssuesByCriteria(criteria).then(function(data) {
				$scope.issues = data;
			});
		}
	});
}]);


/**
 * Controller for creating a new sprint 
 */
ProJack.sprint.controller('SprintCreateController', ['$scope', '$location', 'SprintService', 'KT', function($scope, $location, service, KT) {

	$scope.sprint = service.newSprint();
	
	$scope.saveSprint = function() {
		service.saveSprint($scope.sprint).then(function() {
			KT.alert("Der Sprint wurde angelegt");
			$location.path('/sprints');
		});
	};
}]);


/**
 * Controller for editing a given sprint
*/
ProJack.sprint.controller('SprintEditController', ['$scope', '$location', '$routeParams', 'SprintService', 'KT', function($scope, $location, $routeParams, service, KT) {

	$scope.tinymceOptions = ProJack.config.tinyOptions;
	
	service.getSprintById($routeParams.id).then(function(response) {
		$scope.sprint = response.data;
	});

	$scope.saveSprint= function() {
		service.saveSprint($scope.sprint).then(function() {
			KT.alert('Der Sprint wurde erfolgreich gespeichert');
			$location.path('/sprints');
		});
	};
}]);
