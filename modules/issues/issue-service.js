ProJack.issues.service("IssueService", ['$http', '$q', 'KT', 'SecurityService', function ($http, $q, KT, secService) {
	
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
				reportedBy  : secService.getCurrentUserName(),
				state		: 'NEW', // NEW, ASSIGNED, FEEDBACK, RESOLVED, CLOSED
				issuetype	: 'BUG', // BUG, FEATURE, CHANGE_REQUEST, SUPPORT
				dateCreated : new Date().getTime(),
				dateModified: new Date().getTime(),
				estimatedTime: 0,
				resolveUntil: '',
				notes		: [],
				times		: []	// array of time tracking object for all users
			};
		},
		
		newNote : function() {
			return {
				_id				: KT.UUID(),
				text 			: '',
				timeSpentHours 	: 0,
				timeSpentMinutes: 0,
				tasktype		: 'GENERAL',
				dateCreated 	: new Date().getTime(),
				dateModified	: new Date().getTime(),
				userCreated 	: secService.getCurrentUserName(),
				userModified	: secService.getCurrentUserName()
			};
		},
		
		newTimeTrack : function(username) {
			return {
				_id			: KT.UUID(),
				user		: username,
				state		: 'RUNNING', // possible values: RUNNING, PAUSED
				startTime	: new Date().getTime(),
				endTime     : -1,
				pauseTimes  : 0,
				pause		: {}
			};
		},
		
		newPause: function() {
			return {
				startTime : new Date().getTime(),
			};
		},
		
		getIssueById : function(id) {
			return $http.get(ProJack.config.dbUrl + "/" + id)
				.then(function(response) {
					var issue = response.data;
					
					if (issue.resolveUntil && issue.resolveUntil.length > 0)
						issue.resolveUnitl = new Date(issue.resolveUntil);
					
					if (issue._attachments) {
						issue.attachments = [];
						for (var i in issue._attachments) {
							issue.attachments.push({
								filename : i,
								type : issue._attachments[i].content_type, 
								length : issue._attachments[i].length
							});
						}
					}
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
					var retval = [];
					for (var i in response.data.rows) 
						retval.push(response.data.rows[i].value);
					return retval;
				});
		},
		
		getIssueByFeature : function(feature) {
			return $http.get(ProJack.config.dbUrl + '/_design/issues/_view/byFeature?key="'+feature._id+'"')
				.then(function(response) {
					return response.data.rows[0].value;
				});
		},
		
		getIssuesByCriteria : function(criteria) {
			var status = criteria.status;
			if (criteria.status == "")
				status = "99";
				
			var url = ProJack.config.dbUrl + "/_design/issues/_list/indexfilter/search?";
			
			if (criteria.type !== '') url += "type=" + criteria.type;
			
			if (criteria.selection == 1) url += "uid=org.couchdb.user:" + secService.getCurrentUserName();
			if (criteria.selection == 2) url += "uid=";
			
			if (criteria.customer) url += "&cid=" + criteria.customer;
			if (criteria.milestone !== '') 
				url += "&spec=" + criteria.milestone;
			
			url += "&status=" + criteria.status;
			
			console.debug(url);
			return $http.get(url).then(function(response) {
				return response.data.rows;
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
	
		createIssue : function(issue) {
			if (typeof issue.customer == "object")
				issue.customer = issue.customer._id;
			if (typeof issue.milestone == "object")
				issue.milestone = issue.milestone._id;
			if (typeof issue.feature == "object")
				issue.feature = issue.feature._id;
			
			if (issue.assignedTo && issue.assignedTo.length > 0)
				issue.state = 'ASSIGNED';
			
			var d = $q.defer();
		
			// get the next available numerical ticket number
			// TODO: This kinda sucks! It'll be way cooler if we could set the 
			// number in couch on insert. Check out how this would be done
			$http.get(ProJack.config.dbUrl + "/_design/issues/_view/count?group=false").success(function(data) {
				if (data.rows.length == 0) {
					issue.number = 1;
				} else {
					issue.number = (parseInt(data.rows[0].value) + 1);
				}
				$http.post(ProJack.config.dbUrl, issue)
					.success(function(response) {
						d.resolve(response.data);
					}).error(function() {
						d.reject();
					});
			});
			return d.promise;
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
		},
		
		
		getNextIssueNumber : function() {
			var def = $q.defer();
			$http.get(ProJack.config.dbUrl + '/_design/issues/_view/count?group=false').success(function(data) {
				if (data.rows.length == 0)
					def.resolve({ nextNumber : 1 });
				else 
					def.resolve({ nextNumber : parseInt(data.rows[0].value) + 1});
			}).error(function() {
				def.reject();
			});
			return def.promise;
		},
		
		addAttachment : function(issue, file) {
			var deferred = $q.defer();
			var fr = new FileReader();
			fr.readAsDataURL(file);
			fr.onload = function(e) {
				if (!issue._attachments)
					issue._attachments = {};
				issue._attachments[file.name] = {};
				issue._attachments[file.name]["content_type"] = file.type;
				issue._attachments[file.name]['data'] = fr.result.split(",")[1];
				$http.put(ProJack.config.dbUrl + "/" + issue._id, issue)
				.success(function(response) {
					deferred.resolve({filename : file.name, type : file.type, length : file.size || 0 });
				})
				.error(function(response) {
					deferred.reject(response.data);
				});
			}
			return deferred.promise;
		},
		
		isTimeStartable : function(issue) {
			// condition: times is empty, or no entry for the current user
			if (!issue.times || issue.times.length == 0) return true;
			return (KT.find('user', secService.getCurrentUserName(), issue.times) === undefined);
		},
		
		isTimePauseable : function(issue) {
			// condition: times must be available and the current user has an entry with state == 'RUNNING'
			if (!issue.times || issue.times.length == 0) return false;
			var track = KT.find('user', secService.getCurrentUserName(), issue.times);
			return track.state == 'RUNNING';
		},
		
		isTimeResumable : function(issue) {
			// condition: times must be available for the current user and state == 'PAUSED'
			if (!issue.times || issue.times.length == 0) return false;
			var track = KT.find('user', secService.getCurrentUserName(), issue.times);
			return track.state == 'PAUSED';
		},
		
		startTimeTracking : function(issue) {
			if (!issue.times) issue.times = [];
	
			var user = secService.getCurrentUserName();
			var track = KT.find('user', user, issue.times);
			if (!track) {
				// create a new time tracking
				track = this.newTimeTrack(user);
				issue.times.push(track);
				this.updateIssue(issue).then(function(data) {
					issue._rev = data.rev;
				});
			} else {
				// check for an error in the data model
				if (track.state == 'RUNNING')
					return;
				
				// resume the given time tracking by removing the break,
				// and set the paused times in the track
				var eTime = new Date().getTime();
				var pauseTime = eTime - track.pause.startTime;
				track.pauseTimes += pauseTime;
				track.pause = undefined;
				track.state = 'RUNNING';
				this.updateIssue(issue).then(function(data) {
					issue._rev = data.rev;
				});
			}
		},
		
		pauseTimeTracking : function(issue) {
			var track = KT.find('user', secService.getCurrentUserName(), issue.times);
			if (track) {
				var b = this.newPause();
				track.pause = b;
				track.state = 'PAUSED';
				this.updateIssue(issue).then(function(data) {
					issue._rev = data.rev;
				});
			}
		},
		
		getCurrentTimeTrackingData : function(issue) {
			var retval = {
					startTime : 0,
					pauseTime : 0,
					endTime   : new Date().getTime(),
					result    : 0,
					time      : '',
			}
		
			var user = secService.getCurrentUserName();
			var track = undefined;
			
			for (var i in issue.times) {
				if (issue.times[i].user == user) {
					track = issue.times[i];
			
					retval.startTime = track.startTime;
					
					// calculate the pauses in minutes
					retval.pauseTime = Math.round(track.pauseTimes / (60 * 1000));
					
					// calculate the overall time
					var msecs = retval.endTime - track.startTime - track.pauseTimes;
					retval.result = Math.round(msecs / (60 * 1000));
				
					var hours = Math.floor(msecs / (3600 * 1000));
					var mins  = Math.round((msecs / (60 * 1000)) % 60); 
					
					if (hours < 10)
						hours = '0' + hours;
					if (mins < 10)
						mins = '0' + mins;
					retval.time = hours + ':' + mins;
				}
			}
			return retval;
		},
		
		removeTrackingData : function(issue) {
			var user = secService.getCurrentUserName();
			for (var i in issue.times) {
				if (issue.times[i] && issue.times[i].user == user) {
					issue.times.splice(i,1);
				}
			}
			return issue;
		},
		
		hasActiveTracking : function(issue) {
			var user = secService.getCurrentUserName();
			return (KT.find('user', user, issue.times) !== undefined)
		}
	};
}]);