/**
 * Service that handles all affairs related to issues
 */
ProJack.issues.service("IssueService", ['$http', '$q', 'KT', 'SecurityService', 'ESService', function ($http, $q, KT, secService, elastic) {
	
	return {
		
		/**
		 * Returns a new issue
		 */
		newIssue : function() {
			return {
				type		: 'issue',
				number		: 0,			// the issues ticket number to be displayed
				title		: '',			
				description : '',
				assignedTo  : '', 			// the user the issue is assigned to
				reportedBy  : secService.getCurrentUserName(),
				project		: '',			// the id of the project this issue belongs to
				state		: 'NEW', 		// NEW, ASSIGNED, FEEDBACK, RESOLVED, CLOSED
				issuetype	: 'BUG', 		// BUG, FEATURE, CHANGE_REQUEST, SUPPORT,
				priority	: 'NORMAL',		// LOW, NORMAL, HIGH
				solution	: '',			// The solution for this ticket: FIXED, NOT_REPRODUCIBLE, NOT_FIXABLE, DUPLICATE, WONT_FIX
				dateCreated : new Date().getTime(),
				dateModified: new Date().getTime(),
				estimatedTime: undefined,	// estimated time in seconds this issue will take to be resolved
				resolveUntil: undefined,	// the deadline for this issue,
				tags		: [],			// array of user input strings
				fixedIn		: [],			// takes an array of branches, where the issue has been fixed
				notes		: [],
				times		: [],	        // array of time tracking object for all users,
                observers   : []            // array of usernames observing this ticket
			};
		},
		
		newNote : function() {
			return {
				_id				: KT.UUID(),
				text 			: '',
				timeSpent		: 0,	        				// time in seconds spent on this note
				tasktype		: 'GENERAL',					// the type of work that has been done
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
				startTime : new Date().getTime()
			};
		},

		
		/**
		 * Returns the issue for the given id
		 * @param id The id of the issue to be returned
		 */
		getIssueById : function(id) {
			var _self = this;
			return $http.get(ProJack.config.dbUrl + "/" + id)
				.then(function(response) {
					var issue = response.data;
					
					issue = _self.sanitizeIssue(issue);
					return response.data;
				});
		},
	
		/**
		 * Returns the issue for the given id and revision if available
		 * @param id The id of the issue to be returned
		 * @param rev The revision of the issue to be returned
		 */
		getIssueByIdAndRevision : function(id, rev) {
			var _self = this;
			return $http.get(ProJack.config.dbUrl + '/' + id + '?rev=' + rev).then(function(response) {
				return _self.sanitizeIssue(response.data); 
			});
		},
	
		/**
		 * Returns an array containing all revision id's for the given issue
		 * @param issue The issue to retrieve revisions for
		 */
		getIssueRevisions : function(issue) {
			return $http.get(ProJack.config.dbUrl + '/' + issue._id + '?revs=true').then(function(response) {
				var retval = new Array();
				var c = 0;
				for (var i = response.data._revisions.start; i > 0; i--) {
					retval.push(i + '-' + response.data._revisions.ids[c]);
					c++; // hoehoe
				}
				return retval;
			});
		},
		
	
		/**
		 * Helper function to maintain backwards compatibility.
		 * Should be called each time when an issue is loaded by id
		 */
		sanitizeIssue: function(issue) {
			if (issue.resolveUntil && issue.resolveUntil.length > 0)
				issue.resolveUntil = new Date(issue.resolveUntil);

			if (issue._attachments) {
				issue.attachments = [];
				for (var i in issue._attachments) {
					issue.attachments.push({
						filename : i,
						type     : issue._attachments[i].content_type,
						length	 : issue._attachments[i].length
					});
				}
			}
			return issue;
		},
		
		/**
		 * Returns all issues
		 */
		getAllIssues : function() {
			return $http.get(ProJack.config.dbUrl + "/_design/issues/_view/index")
				.then(function(response) {
					var retval = new Array();
					for (var i in response.data.rows)
						retval.push(response.data.rows[i].value);
					return retval;
				});
		},
	
        /**
         * Returns all issues that are visible by the current user
         * @returns Array of issues
         */
        getObservedIssues : function() {
            var user = secService.getCurrentUserName();
            return $http.get(ProJack.config.dbUrl + '/_design/issues/_view/byObserver?key="' + user + '"')
                .then(function(response) {
                    var retval = new Array();
                    for (var q in response.data.rows)
                        retval.push(response.data.rows[q].value);
                    return retval;
                });
        },
		
		/**
		 * Returns all issues matching the given filter criteria
		 * @param criteria The criteria to filter the issues
		 */
		getIssuesByCriteria : function(predicates, sort, page) {
			var params = {};
		
			if (predicates.issuetype && predicates.issuetype !== '') 
				params.issuetype = predicates.issuetype;
		
			if (predicates.selection == 1)
				params.assignedTo = 'org.couchdb.user:' + secService.getCurrentUserName();
			if (predicates.selection == 2)
				params.assignedTo = '';
	
			if (predicates.project != '')
				params.project = predicates.project;
			
			if (predicates.tags)
				params.tags = predicates.tags;
			
			params.state = predicates.status;
			
			return elastic.query('issue', params, 
					sort.predicate, 
					sort.reverse, 
					page.offset,
					page.size); 
		},
		
		/**
		 * Returns the sum of all note.timeSpent (seconds) on this issue.
         * @param issue The issue to calculate times on
		 */
		calculateTimeOnIssue : function(issue) {
			// calculate the overall time on this issue
			var retval = 0;
			
			for (var i in issue.notes) {
				// new format
				if (issue.notes[i].timeSpent) {
					retval += issue.notes[i].timeSpent;
					
				} else if (issue.notes[i].timeSpentHours != undefined) {
					// old format
					var spent = parseInt(issue.notes[i].timeSpentHours) * 3600;
					spent +=    parseInt(issue.notes[i].timeSpentMinutes) * 60;
					retval += spent;
					issue.notes[i].timeSpent = spent;
				}
			}
			return retval;
		},
	
		
		/**
		 * Persists a issue in the DB
		 * @param issue The issue that should be persisted
		 */
		createIssue : function(issue) {
		
			if (issue.assignedTo && issue.assignedTo.length > 0)
				issue.state = 'ASSIGNED';
			
			var d = $q.defer();
			var that = this;
		
			// get the next available numerical ticket number
			$http.get(ProJack.config.dbUrl + "/_design/issues/_view/count?group=false").success(function(data) {
				if (data.rows.length == 0) {
					issue.number = 1;
				} else {
					issue.number = (parseInt(data.rows[0].value) + 1);
				}
				
				that.createHyperlinks(issue).then(function(issue) {
					$http.post(ProJack.config.dbUrl, issue)
					.success(function(response) {
						issue._id = response.id;
						issue._rev= response.rev;
						elastic.index('issue', issue);
						d.resolve(issue);
					}).error(function() {
						d.reject();
					});				
				});
			});
			return d.promise;
		},
		
		
		/**
		 * Updates the given issue in the DB
		 * @param issue The issue that should be updated
		 */
		updateIssue : function(issue) {
			
			// dates shall be stored as timestamps
			issue.dateCreated  = KT.sanitizeDate(issue.dateCreated);
			issue.resolveUntil = KT.sanitizeDate(issue.resolveUntil);
			issue.dateModified = new Date().getTime();
			
			// remove customer, since it doesn't exist any more
			issue.customer = undefined;
			
			return this.createHyperlinks(issue).then(function(issue) {
				return $http.put(ProJack.config.dbUrl + "/" + issue._id, issue).then(function(response) {
					issue._rev = response.data.rev;
					elastic.index('issue', issue);
					return issue;
				});
			});
		},
		
	
		/**
		 * Creates a hyperlink to another issue by exchanging all occurences of the pattern
		 * #[0-9]* with an actual hyperlink in the issues description and notes
		 */
		createHyperlinks : function(issue) {
		
			// pattern matches #12 but not within a hyperlink like <a>#15</a>
			var pattern = /[^>|"]#([0-9]*)/g;
			var occurences = {};
			var numbers = [];
			
		
			var t = null;
			while ((t = pattern.exec(issue.description)) !== null) {
				occurences[t[1]] = undefined;
				numbers.push(t[1]);
			}

			angular.forEach(issue.notes, function(e) {
				while ((t = pattern.exec(e.text)) !== null) {
					occurences[t[1]] = undefined;
					numbers.push(t[1]);
				}
			});
		
			return $http.get(ProJack.config.dbUrl + '/_design/issues/_view/byNumber?keys=[' + numbers + ']').then(function(result) {
				for (var x in occurences) {
					occurences[x] = KT.find('key', x, result.data.rows);
					
					if (occurences[x]) {
						var strikeout = '';
						if (occurences[x].value.state == 'CLOSED')
							strikeout = ' class="strikethrough" '
						var link = ' <a href="#/issues/'+ occurences[x].id +'/edit" '+strikeout+'>#' + x + '</a> ';
			
						var t = new RegExp('[^>|"]#('+x+')', 'g'); 
						
						issue.description = issue.description.replace(t, link);
						angular.forEach(issue.notes, function(e) {
							e.text = e.text.replace(t, link);
						});
					}
				}
				return issue;
			});
		},
		
		
		/**
		 * Deletes the given issue
		 * @param issue The issue that should be deleted
		 */
		deleteIssue : function(issue) {
			return $http({
				method 	: 'DELETE',
				url 	: ProJack.config.dbUrl + "/" + issue._id + "?rev=" + issue._rev 
			});
		},
		
		
		/**
		 * Returns the next issue number
		 * Note: This implementation does not support concurrency. When 2 users independently call
		 * this method, it might occur that they will get the same issue number.
		 */
		getNextIssueNumber : function() {
			var def = $q.defer();
			$http.get(ProJack.config.dbUrl + '/_design/issues/_view/search?descending=true&limit=1').success(function(data) {
				if (data.rows.length == 0)
					def.resolve({ nextNumber : 1 });
				else 
					def.resolve({ nextNumber : parseInt(data.rows[0].key) + 1});
			}).error(function() {
				def.reject();
			});
			return def.promise;
		},
		
		
		/**
		 * Adds an attachment to the issue and updates the issue in the DB
		 * @param issue The issue to attach the file
		 * @param file  The file to be attached
		 */
		addAttachment : function(issue, file) {
			var deferred = $q.defer();
			var fr = new FileReader();
			fr.readAsDataURL(file);
			fr.onload = function() {
				if (!issue._attachments)
					issue._attachments = {};
				issue._attachments[file.name] = {};
				issue._attachments[file.name]["content_type"] = file.type;
				issue._attachments[file.name]['data'] = fr.result.split(",")[1];
				
				$http.put(ProJack.config.dbUrl + "/" + issue._id, issue).success(function(response) {
					issue._rev = response.rev;
					elastic.index('issue', issue);
					deferred.resolve({filename : file.name, type : file.type, length : file.size || 0 });
				})
				.error(function(response) {
					deferred.reject(response.data);
				});
			};
			return deferred.promise;
		},
		
		/**
		 * Returns whether or not time tracking could be started for the current user on the given issue
		 * @param issue The issue in question
		 */
		isTimeStartable : function(issue) {
			// condition: times is empty, or no entry for the current user
			if (!issue.times || issue.times.length == 0) return true;
			return (KT.find('user', secService.getCurrentUserName(), issue.times) === undefined);
		},
		
		/**
		 * Returns whether or not time tracking could be paused for the current user on the given issue
		 * @param issue The issue in question
		 */
		isTimePauseable : function(issue) {
			// condition: times must be available and the current user has an entry with state == 'RUNNING'
			if (!issue.times || issue.times.length == 0) return false;
			var track = KT.find('user', secService.getCurrentUserName(), issue.times);
			if (!track) return false;
			return track.state == 'RUNNING';
		},

        /**
         * Returns whether or not time tracking could be resumed for the current user on the given issue
         * @param issue The issue in question
         */
		isTimeResumable : function(issue) {
			// condition: times must be available for the current user and state == 'PAUSED'
			if (!issue.times || issue.times.length == 0) return false;
			var track = KT.find('user', secService.getCurrentUserName(), issue.times);
			if (!track) return false;
			return track.state == 'PAUSED';
		},
		
		/**
		 * Starts or resumes the time tracking on the given issue.
		 * This method accepts issues that return true for #isTimeStartable and #isTimeResumeable
		 * @param issue The issue to start time tracking on.
		 */
		startTimeTracking : function(issue) {
			var def = $q.defer();
			
			if (!issue.times) issue.times = [];
	
			var user = secService.getCurrentUserName();
			var track = KT.find('user', user, issue.times);
			if (!track) {
				// create a new time tracking
				track = this.newTimeTrack(user);
				issue.times.push(track);
				this.updateIssue(issue).then(function() {
					def.resolve();
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
				this.updateIssue(issue).then(function() {
					def.resolve();
				});
			}
			return def.promise;
		},
		
		/**
		 * Pauses the time tracking on the given issue
		 * @param issue The issue to pause tracking on
		 */
		pauseTimeTracking : function(issue) {
			var track = KT.find('user', secService.getCurrentUserName(), issue.times);
			if (track) {
                track.pause = this.newPause();
				track.state = 'PAUSED';
				this.updateIssue(issue).then(function() {
					return issue;
				});
			}
		},
		
		
		/**
		 * Returns an object containing the data for the current users time tracking session.
		 * @param issue The issue to return tracking data for
		 */
		getCurrentTimeTrackingData : function(issue) {
			var retval = {
					startTime : 0,
					pauseTime : 0,
					endTime   : new Date().getTime(),
					result    : 0
			};
		
			var user = secService.getCurrentUserName();
			var track = undefined;
			
			for (var i in issue.times) {
				if (issue.times[i].user == user) {
					track = issue.times[i];
			
					retval.startTime = track.startTime;
					
					// calculate the pauses in seconds 
					retval.pauseTime = Math.round(track.pauseTimes / (1000));
					
					// calculate the overall time
					var msecs = retval.endTime - track.startTime - track.pauseTimes;
					retval.result = Math.floor(msecs / 1000);
				}
			}
			return retval;
		},
		
		/**
		 * Removes tracking data for the current user from the specified issue
		 * @param issue The issue to remove tracking data from
		 */
		removeTrackingData : function(issue) {
			var user = secService.getCurrentUserName();
			for (var i in issue.times) {
				if (issue.times[i] && issue.times[i].user == user) {
					issue.times.splice(i,1);
				}
			}
			return issue;
		},
		
		/**
		 * Returns whether tracking is active for the current user on the given issue
         * @param issue The issue in question
		 */
		hasActiveTracking : function(issue) {
			var user = secService.getCurrentUserName();
			return (KT.find('user', user, issue.times) !== undefined);
		},
		
	
		getChangelog : function(customerId, from, to) {
			var fd = new Date(from).getTime();
			var td = new Date(to).getTime();
			
			var def = $q.defer();
			var k   = 'startkey=["' + customerId + '", "' + fd + '"]&endkey=["' + customerId + '", "' + td + '"]';
			$http.get(ProJack.config.dbUrl + "/_design/issues/_view/byClosingDate?" + k).success(function(response) {
				var retval = new Array();
				for (var i in response.rows) {
					retval.push(response.rows[i].value);
				}
				def.resolve(retval);
			}).error(function() {
				def.reject();
			});
			return def.promise;
		},

        toggleObservation : function(issue) {
            var user = secService.getCurrentUserName();
            // check for old data - might not contain the observers array
            if (!issue.observers) issue.observers = [];

            // check if the user already observing the issue
            if (issue.observers.indexOf(user) > -1) {
                var idx = issue.observers.indexOf(user);
                issue.observers.splice(idx, 1);
            } else {
                issue.observers.push(user);
            }
            var def = $q.defer();
            this.updateIssue(issue).then(function(data) {
               def.resolve();
            });
            return def.promise;
        }
	};
}]);
