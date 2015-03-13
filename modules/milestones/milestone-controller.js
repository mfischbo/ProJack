ProJack.milestones.controller('MileStonesController', ['$scope', 'MilestoneService', 'KT',
	function($scope, service, KT) {
	
	$scope.milestones = [];
	$scope.archived = [];
	
	var archiveInitialized = false;
	
	service.getAllMilestones().then(function(data) {
		$scope.milestones = data;
	});
	
	$scope.initArchive = function() {
		if (archiveInitialized) return;
		service.getArchivedMilestones().then(function(data) {
			$scope.archived = data;
			archivedInitialized = true;
		});
	};
	
	$scope.deleteMilestone = function(milestone) {
		KT.confirm("Soll der Milestone wirklich entfernt werden?", function() {
			service.deleteMilestone(milestone).then(function() {
				KT.remove('_id', milestone._id, $scope.milestones);
				KT.alert("Der Milestone wurde entfernt");
			});
		});
	};
	
}]);

ProJack.milestones.controller('MileStonesCreateController', ['$scope', '$location', 'KT', 'MilestoneService', 'CustomerService',
	function($scope, $location, KT, service, customerService) {

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



ProJack.milestones.controller('MileStonesAnalyzeController', ['$scope', '$routeParams', '$filter', 'KT', 'MilestoneService', 'IssueService', 
                                                              function($scope, $routeParams, $filter, KT, mService, iService) {

	// the milestone that is being analyzed
	$scope.milestone = undefined;
	
	// the issues related to this milestone
	$scope.issues = [];
	
	// the times spent on all issues related to the milestone
	$scope.times = undefined;
	
	$scope.trendChart = [ { key : 'Chart', values : [] }];
	$scope.chartOpts = {
			chart : {
				type : 'discreteBarChart',
				height: 400,
				x  : function(d) {
					return d.label;
				},
				y : function(d) {
					return d.value
				},
				yAxis : {
					tickFormat : function(p) {
						return $filter('secsToTime')(p);
					}
				},
				color : function(x, y) {
					if (x.value < 0) return '#D9042B';
					return '#BEDB39';
				},
				tooltipContent : function(key, x, y) {
					var retval = '<h5 class="popover-title"><strong>';
					if (x == 'Gesamt') retval += 'Gesamt';
					else
						retval += '#' + x;
					retval += '</strong></h5><p>';
					
					if (x != 'Gesamt')
						retval += KT.find('number', x, $scope.issues).title;
					else 
						retval += 'Gesamt';
					retval +='</p><p>' + y + ' </p>'; 
					return retval;
				}
			}
	};
	
	
	mService.getMilestoneById($routeParams.id).then(function(milestone) {
		$scope.milestone = milestone;
		
		iService.getIssuesByMilestone($scope.milestone).then(function(issues) {
			$scope.issues = issues;
			iService.getSpentTimesByMilestone($scope.milestone).then(function(times) {
				$scope.times = times;
			});
		
			// issue trend barchart
			var chart = [];
			
			// calculate saldo on each feature issue
			var sum = 0;
			for (var i in $scope.issues) {
				var issue = $scope.issues[i];
				if (issue.issuetype == 'FEATURE') {
					var f = KT.find('_id', issue.feature, $scope.milestone.specification.features);
					
					// sum up times for issue
					var t = 0;
					for (var q in issue.notes) {
						if (issue.notes[q].timeSpent) t += issue.notes[q].timeSpent;
					}
					if (!f)
						chart.push( { label : issue.number, value : 0 } );
					else
						chart.push( { label : issue.number, value : (f.estimatedEffort || 0) - t});
				}
		
				// bug tickets always count negatively
				if (issue.issuetype == 'BUG') {
					var t = 0;
					for (var q in issue.notes) {
						if (issue.notes[q].timeSpent) t += issue.notes[q].timeSpent;
					}
					sum += (0-t);
					chart.push( { label : issue.number, value : (0 - t) } );
				}
			}
			chart.push( { label : 'Gesamt', value : sum });
			$scope.trendChart[0].values = chart;
		});
	});
	
	
	$scope.getFeatureTime = function(mFactor) {
		if (!$scope.milestone) return 0;
		var k = 0;
		for (var i in $scope.milestone.specification.features) {
			var f = $scope.milestone.specification.features[i];
			k += parseInt(f.estimatedEffort);
		}
		return k * mFactor;
	};
	
	$scope.getTimeForTicketType = function(type) {
		if (!$scope.issues) return 0;
		var k = 0;
		for (var i in $scope.issues) {
			var issue = $scope.issues[i];
			
			if (type.indexOf(issue.issuetype) > -1) {
				for (var q in issue.notes) {
					if (issue.notes[q].timeSpent)
						k+= parseInt(issue.notes[q].timeSpent);
				}
			}
		}
		return k;
	};
	
}]);



ProJack.milestones.controller('MileStonesEditController', ['$scope', '$routeParams', 'KT', 'MilestoneService', 'CustomerService', 'IssueService', 
	function($scope, $routeParams, KT, service, customerService, issueService) {

	$scope.tab = 'MILESTONE';
	$scope.template = { _id : undefined };
	
	$scope.tinyOptions = ProJack.config.tinyOptions;
	
	customerService.getAllCustomers().then(function(data) {
		$scope.customers = data;

		service.getMilestoneById($routeParams.id).then(function(data) {
			$scope.milestone = data;
			
			service.getAggregation($scope.milestone).then(function(aggr) {
				$scope.aggregation = aggr;
			});
		
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
			$scope.milestone._rev = data.rev;
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
	
	$scope.printMilestone = function(type) {
		service.printMilestone($scope.milestone, $scope.template, type).then(function() {
			KT.alert("Das Pflichtenheft wurde erfolgreich angelegt");
		});
	};
	
	$scope.recalcEstimation = function() {
		$scope.focusedFeature.estimatedEffort = $scope.focusedFeature.estimatedBE + $scope.focusedFeature.estimatedUI;
	}
	
	$scope.downloadAttachment = function(a) {
		window.open(ProJack.config.dbUrl + "/" + $scope.milestone._id + "/" + a.name, '_blank');
	};
}]);
