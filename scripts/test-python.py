import json, sys
from pathlib import Path
references = json.load(sys.stdin)
harness = Path('public/runners/harness.py').read_text().replace('json.dumps(iwons_execute(json.loads(iwons_request)))', 'iwons_response = json.dumps(iwons_execute(json.loads(iwons_request)))')
out = []
for ref in references:
    req = {**ref['problem'], 'code':ref['python'], 'cases':ref['cases']}
    namespace = {'iwons_request':json.dumps(req)}
    exec(compile(harness, 'harness.py', 'exec'), namespace)
    out.append(json.loads(namespace['iwons_response']))
print(json.dumps(out))
