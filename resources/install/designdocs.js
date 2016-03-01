function getDesignDocs() {
	
	return [
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
                        byObserver: {
                            map: "function(doc) { if (doc.type == 'issue' && doc.observers && doc.observers.length > 0) { for (var q in doc.observers) { emit(doc.observers[q], doc); } } }"
                        },
	                    count: {
	                        map: "function(doc) {\n  if (doc.type == 'issue') {\n    emit(doc._id, doc);\n  }\n}",
	                        reduce: "_count"
	                    },
	                    search: {
	                        map: "function(doc) {\n  if (doc.type == 'issue') {\n      emit(doc.number, doc);\n  }\n}"
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
	        			},
	        			fullsprint : {
	        				map : "function (doc) {\n  if (doc.type === 'sprint') {\nemit ([doc._id, -1], 1);\n    if (doc.lanes) {\n      var x = 0;\n      for (var i in doc.lanes) {\n        for (var q in doc.lanes[i].issues) {\n          emit([doc._id, x], {_id : doc.lanes[i].issues[q]._id });\n          x++;\n        }\n      }\n    }\n  }}"
	        			}
	        		},
	       		   filters : {
	       			   sprint : "function(doc, req) { return (doc.type == 'issue' && doc.sprint && doc.sprint == req.query.sprint)}" 
	        	   }
	        	}
	        }
	];
};