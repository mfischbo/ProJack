function getDesignDocs() {
	
	return [
	        {
	        	name : "assignments",
	        	doc  : {
		        	language: "javascript",
	                views: {
	                    byDateAndUser: {
	                        map: "function(doc) {\n  if (doc.type == 'assignment') {\n     emit([doc.date, doc.user], doc);\n  }\n}"
	                    },
	                    hoursByMilestone: {
	                        map: "function(doc) {\n  if (doc.type == 'assignment') {\n     if (doc.lower.milestone.length > 0) {\n       emit([doc.lower.milestone, doc._id], 4);\n     }\n     if (doc.upper.milestone.length > 0) {\n       emit([doc.upper.milestone, doc._id], 4);\n     }\n  }\n}",
	                        reduce: "function (key, value, rereduce) {\n  return sum(value);\n}"
	                    },
	                    byUserAndDate: {
	                        map: "function(doc) {\n  if (doc.type == 'assignment') {\n     emit([doc.user, doc.date], doc);\n  }\n}"
	                    }
	                }
	        	}
	        },
	        
	        {
	        	name : "customers",
	        	doc  : {
	        		language: "javascript",
	                views: {
	                    index: {
	                        map: "function(doc) {\n  if (doc.type == \"customer\" || doc._type == 'customer')\n      emit(doc._id, doc);\n}"
	                    },
	                    byCountry: {
	                        map: "function(doc) {\n  if (doc.type == \"customer\" && doc.address && doc.address.country)\n      emit(doc.address.country, doc);\n}"
	                    }
	                }
	        	}
	        },
	        
	        {
	        	name : "issues",
	        	doc  : {
	        		language: "javascript",
	                lists: {
	                    indexfilter: "function(head, req) { var m = { 'NEW': 0, 'ASSIGNED': 1, 'FEEDBACK': 2, 'RESOLVED': 3, 'CLOSED': 4 }; var t = { 'BUG': 0, 'CHANGE_REQUEST': 1, 'FEATURE': 2, 'SUPPORT': 3 }; var row; var retval = { rows: [] }; while (row = getRow()) { if (row.value.type == 'issue') { var fUser = true; var fCust = true; var fSpec = true; var fStat = true; var fType = true; if (req.query.uid !== undefined) fUser = (req.query.uid == row.value.assignedTo); if (req.query.cid !== undefined) fCust = (req.query.cid == row.value.customer); if (req.query.spec !== undefined) fSpec = (req.query.spec == row.value.milestone); if (req.query.status) fStat = (parseInt(req.query.status) >= m[row.value.state]); if (req.query.type !== undefined) fType = (parseInt(req.query.type) == t[row.value.issuetype]); if (fUser && fCust && fSpec && fStat && fType) retval.rows.push(row.value); } } send(toJSON(retval)); }"
	                },
	                views: {
	                    index: {
	                        map: "function(doc) {\n  if (doc.type == 'issue') {\n    emit(doc._id, doc);\n  }\n}"
	                    },
	                    byCustomer: {
	                        map: "function(doc) {\n  if (doc.type == 'issue') {\n    emit(doc.customer, doc);\n  }\n}"
	                    },
                        byObserver: {
                            map: "function(doc) { if (doc.type == 'issue' && doc.observers && doc.observers.length > 0) { for (var q in doc.observers) { emit(doc.observers[q], doc); } } }"
                        },
	                    byMilestone: {
	                        map: "function(doc) {\n  if (doc.type == 'issue') {\n    emit(doc.milestone, doc);\n  }\n}"
	                    },
	                    count: {
	                        map: "function(doc) {\n  if (doc.type == 'issue') {\n    emit(doc._id, doc);\n  }\n}",
	                        reduce: "_count"
	                    },
	                    search: {
	                        map: "function(doc) {\n  if (doc.type == 'issue') {\n      emit(doc.number, doc);\n  }\n}"
	                    },
	                    milestoneStats: {
	                        map: "function(doc) {\n  if (doc.type == 'issue') {\n    emit(doc.milestone, doc);\n  }\n}",
	                        reduce: "function sumTimes(issue) {\n  var retval = 0;\n  for (var i in issue.notes) {\n    if (issue.notes[i].timeSpent) {\n\tretval += issue.notes[i].timeSpent;\t\t\t\n     } else if (issue.notes[i].timeSpentHours != undefined) {\n\t// old format\n\tvar spent = parseInt(issue.notes[i].timeSpentHours) * 3600;\n\tspent +=    parseInt(issue.notes[i].timeSpentMinutes) * 60;\n\tretval += spent;\n     }\n  }\n  return retval;\n}\n\nfunction(key, values, rereduce) {\n    var closed   = 0, closedSpent   = 0, closedAssigned   = 0;\n    var assigned = 0, assignedSpent = 0, assignedAssigned = 0;\n    var feedback = 0, feedbackSpent = 0, feedbackAssigned = 0;\n    var resolved = 0, resolvedSpent = 0, resolvedAssigned = 0;\n    var news     = 0, newAssigned   = 0, newSpent         = 0;\n    \n    for (var i in values) {\n      var issue = values[i];\n\n      if (issue.state == 'CLOSED') {\n        closed++;\n        closedSpent += sumTimes(issue);\n        if (issue.assignedTo !== '') closedAssigned++;\n      }\n\n      if (values[i].state == 'ASSIGNED') {\n        assigned++;\n        assignedSpent += sumTimes(issue);\n        if (issue.assignedTo !== '') assignedAssigned++;\n      }\n\n      if (values[i].state == 'FEEDBACK') {\n        feedback++;\n        feedbackSpent += sumTimes(issue);\n        if (issue.assignedTo !== '') feedbackAssigned++;\n      }\n\n      if (values[i].state == 'RESOLVED') {\n        resolved++;\n        resolvedSpent += sumTimes(issue);\n        if (issue.assignedTo !== '') resolvedAssigned++;\n      }\n\n      if (values[i].state == 'NEW') {\n        news++;\n        newSpent += sumTimes(issue);\n        if (issue.assignedTo !== '') newAssigned++;\n      }\n    }\n\n    return {\n      new : {\n        count : news,\n        assigned : newAssigned,\n        timeSpent : newSpent\n      },\n      assigned : {\n        count : assigned,\n        assigned : assignedAssigned,\n        timeSpent : assignedSpent\n      },\n      feedback : {\n        count : feedback,\n        assigned : feedbackAssigned,\n        timeSpent : feedbackSpent\n      },\n      resolved : {\n        count : resolved,\n        assigned : resolvedAssigned,\n        timeSpent : resolvedSpent\n      },\n      closed : {\n        count : closed,\n        assigned : closedAssigned,\n        timeSpent : closedSpent\n      }\n    }\n}\n"
	                    },
	                    byFeature: {
	                        map: "function(doc) {\n  if (doc.type == 'issue' && doc.feature && doc.feature.length > 0) {\n    emit(doc.feature, doc);\n  }\n}"
	                    },
	                    byUserAndResolveDate: {
	                        map: "function(doc) {\n  if (doc.type == 'issue') {\n    var d = undefined;\n    if (typeof doc.resolveUntil === 'string' && doc.resolveUntil.length > 0)\n       d = new Date(doc.resolveUntil).getTime();\n    \n    if (typeof doc.resolveUntil === 'number')    \n       d = doc.resolveUntil;\n\n    if (d == undefined)\n       d = Number.MAX_VALUE;\n\n    emit([doc.assignedTo.replace('org.couchdb.user:', ''), doc.state, d], doc);\n  }   \n}"
	                    },
	                    byClosingDate: {
	                    	map: "function(doc) { if (doc.type == 'issue' && (doc.state == 'CLOSED' || doc.state == 'RESOLVED')) { var cid = doc.customer; if (typeof doc.customer === 'object') cid = doc.customer._id; emit([cid, '' + doc.dateModified + ''], doc); } }"
	                    },
	                    bySprint : {
	                    	map: "function(doc) { if (doc.type == 'issue' && doc.sprint && doc.sprint.length > 0) { emit(doc.sprint, doc); } }"
	                    },
	                    byType: {
	                        map: "function(doc) {\n  if (doc.type == 'issue') {\n    emit([doc.state, doc.issuetype], doc);\n  }\n}",
	                        reduce: "_count"
	                    },
	                    trackings: {
	                        map: "function(doc) {\n  if (doc.type == 'issue' && doc.times.length > 0) {\n    for (var i in doc.times) {\n      emit(doc.times[i].user, doc);\n    }\n  }\n}"
	                    },
	                    byTimeSpent: {
	                        map: "function(doc) {\n  if (doc.type == 'issue') {\n    var bt = 0;\n    var ft = 0;\n    var gt = 0;\n    for (var i in doc.notes) {\n      if (doc.notes[i].tasktype == 'GENERAL') gt += parseInt(doc.notes[i].timeSpent);\n      if (doc.notes[i].tasktype == 'BACKEND') bt += parseInt(doc.notes[i].timeSpent);\n      if (doc.notes[i].tasktype == 'FRONTEND')ft += parseInt(doc.notes[i].timeSpent);\n    }\n    emit([doc.milestone, 'GENERAL'], gt || 0);\n    emit([doc.milestone, 'BACKEND'], bt || 0);\n    emit([doc.milestone, 'FRONTEND'], ft || 0);\n  }\n}",
	                        reduce: "_sum"
	                    }
	                }
	        	}
	        },
	        
	        {
	        	name : "milestones",
	        	doc  : {
	        		language: "javascript",
	                lists: {
	                    inDevelopmentFilter: "function(head, req) { var retval = { rows : [] }; var row = undefined; while (row = getRow()) { if (row.value.type == 'milestone') { if (row.value.status !== 'CERTIFIED') { retval.rows.push(row.value); } } } send(toJSON(retval)); }"
	                },
	                views: {
	                    index: {
	                        map: "function(doc) {\n  if (doc.type == 'milestone' || doc._type == 'milestone') {\n    emit(doc._id, doc);\n  }\n}"
	                    },
	                    byCustomer: {
	                        map: "function(doc) {\n  if (doc.type == 'milestone' || doc._type == 'milestone') {\n    emit(doc.customer._id, doc);\n  }\n}"
	                    },
	                    byDateAccounted: {
	                        map: "function(doc) {\n  if (doc.type == 'milestone' && doc.status == 'CERTIFIED')\n    emit(doc.dateAccounted, doc);\n}"
	                    }
	                }
	        	}
	        },
	        
	        {
	        	name : "sprints",
	        	doc  : {
	        		language : "javascript",
	        		views : {
	        			byReleaseDate : {
	        				map : "function(doc) {\n if (doc.type == 'sprint') {\n var e = new Date(doc.releaseAt).getTime();\n emit(e, doc);\n }\n }"
	        			}
	        		}
	        	}
	        },
	        
	        
	        {
	        	name : "templates",
	        	doc  : {
	        		language: "javascript",
	                views: {
	                    index: {
	                        map: "function(doc) {\n  if (doc.type == 'template')\n    emit(doc._id, doc);\n}"
	                    }
	                }
	        	}
	        },
	        
	        
	        {
	        	name : "timefeed",
	        	doc  : {
	        		language: "javascript",
	                lists: {
	                    userFilter: "function (head, req) { var r; var retval = { rows : [] }; while (r = getRow()) { if (r.value.userCreated && r.value.userCreated.length > 0) { if ((r.value.userCreated) == req.userCtx.name) retval.rows.push(r); } else if (r.value.type == 'issue') { var user = 'org.couchdb.user:' + req.userCtx.name; if (!r.value.assignedTo) retval.rows.push(r); if (r.value.assignedTo == user) retval.rows.push(r); } else { retval.rows.push(r); } } return toJSON(retval); }"
	                },
	                views: {
	                    milestones: {
	                        map: "function(doc) {\n  if (doc.type == 'milestone') {\n\n    if (doc.plannedCompletionDate) {\n        var q = new Date(doc.plannedCompletionDate);\n        emit([q.getFullYear(), q.getMonth()+1, q.getDate(), 'MILESTONE', 0], doc);\n    }\n\n    if (doc.plannedApprovalDate) {\n       var x = new Date(doc.plannedApprovalDate);\n       emit([x.getFullYear(), x.getMonth()+1, x.getDate(), 'MILESTONE', 1], doc);\n    }\n\n    if (doc.plannedReleaseDate) {\n        var k = new Date(doc.plannedReleaseDate);\n        emit([k.getFullYear(), k.getMonth() + 1, k.getDate(), 'MILESTONE', 2], doc);\n\n        var o = k.getTime() + 3600 * 1000 * 24 * (doc.daysForPayment || 14);\n        var t = new Date(o);\n        emit([t.getFullYear(), t.getMonth() + 1, t.getDate(), 'MILESTONE', 3], doc);\n    }\n  }\n}"
	                    },
	                    reminders: {
	                        map: "function(doc) {\n\n  // key: [year, month, day, hour, minute, type]\n  // where type is :\n  // 0: user reminder\n  // 1: milestone planned release date\n  // 2: milestone planned completion date\n\n  // user generated reminders\n  if (doc.type == 'reminder') {\n    if (doc.alertAt !== undefined && doc.alertTime !== undefined) {\n      var x = new Date(doc.alertAt);\n      var q = new Date(doc.alertTime);\n      emit([x.getFullYear(), x.getMonth()+1, x.getDate(), q.getUTCHours()+1, q.getUTCMinutes(), 0], doc);\n    }\n  }\n\n  // calendar entries from milestones\n  if (doc.type == 'milestone') {\n    if (doc.plannedReleaseDate !== undefined && (doc.actualReleaseDate == undefined || doc.actualReleaseDate.length == 0)) {\n       var x = new Date(doc.plannedReleaseDate);\n       emit([x.getFullYear(), x.getMonth()+1, x.getDate(), 0, 0, 0, 1], doc);\n    }\n\n    if (doc.plannedCompletionDate !== undefined && !doc.status == 'NEW') {\n       var x = new Date(doc.plannedCompletionDate);\n       emit([x.getFullYear(), x.getMonth()+1, x.getDate(), 0, 0, 0, 2], doc);\n    }\n  }\n\n  // entries for issue deadlines\n  if (doc.type == 'issue') {\n    if (doc.resolveUntil !== undefined && doc.state !== 'RESOLVED' && doc.state !== 'CLOSED') {\n       var x = new Date(doc.resolveUntil);\n       emit([x.getFullYear(), x.getMonth()+1, x.getDate(), 0, 0, 0, 3], doc);\n    }\n  }\n}"
	                    }
	                }
	        	}
	        }
	];
};