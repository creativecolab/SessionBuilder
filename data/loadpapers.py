import csv
import sys
import re
from datetime import time
from itertools import islice
from pymongo import MongoClient

client = MongoClient(sys.argv[1].rstrip('\n'))
#db = client['sessionbuilder_meteor_com']
db = client['meteor']
papers = db.papers

with open("./papers.csv", "rU") as csvfile:
	datareader = csv.reader(csvfile, delimiter=",")
	datareader.next()
	false = False
	for row in datareader:
		_id = row[0];
		title = row[1];
		try:
			papers.insert({'_id': _id, 'title': title, 'inSession': false, 'sessions': []});
		except Exception:
			print Exception
