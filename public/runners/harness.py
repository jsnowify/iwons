import json, io, contextlib, time, traceback

class ListNode:
    def __init__(self, val=0, next=None): self.val, self.next = val, next

class TreeNode:
    def __init__(self, val=0, left=None, right=None): self.val, self.left, self.right = val, left, right

def iwons_list(values, pos=-1):
    nodes = [ListNode(v) for v in values]
    for i in range(len(nodes)-1): nodes[i].next = nodes[i+1]
    if nodes and pos >= 0: nodes[-1].next = nodes[pos]
    return nodes[0] if nodes else None

def iwons_tree(values):
    if not values or values[0] is None: return None
    root = TreeNode(values[0])
    q, i = [root], 1
    for n in q:
        for side in ('left', 'right'):
            if i >= len(values): return root
            v = values[i]
            i += 1
            if v is not None:
                node = TreeNode(v)
                setattr(n, side, node)
                q.append(node)
    return root

def iwons_output(value, kind):
    if kind == 'list':
        out, seen = [], set()
        while value:
            if id(value) in seen or len(out) > 10000: raise ValueError('Result is cyclic or too large')
            seen.add(id(value))
            out.append(value.val)
            value = value.next
        return out
    if kind == 'tree':
        if not value: return []
        out, q = [], [value]
        for n in q:
            if len(out) > 20000: raise ValueError('Tree result is cyclic or too large')
            out.append(n.val if n else None)
            if n: q.extend([n.left, n.right])
        while out and out[-1] is None: out.pop()
        return out
    return value

def iwons_execute(req):
    try:
        compiled = compile(req['code'], 'solution.py', 'exec')
    except SyntaxError as e:
        return {'verdict':'compile_error','cases':[], 'compileError':{'message':f'{e.msg} (line {e.lineno})', 'line':e.lineno}}
    results = []
    for test in req['cases']:
        start, output = time.perf_counter(), io.StringIO()
        result = {'id':test['id'], 'expected':test['expected'], 'actual':None, 'passed':False, 'stdout':'', 'runtimeMs':0}
        try:
            namespace = {'ListNode':ListNode, 'TreeNode':TreeNode}
            args = json.loads(json.dumps(test['input']))
            with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
                exec(compiled, namespace)
                fn = namespace[req['functionName']]
                if req.get('mode') == 'operations':
                    actual = []
                    for i, op in enumerate(args[0]):
                        if i == 0: obj = fn(*args[1][i]); actual.append(None)
                        else: actual.append(getattr(obj, op)(*args[1][i]))
                else:
                    for k, kind in req.get('inputKinds', {}).items():
                        i = int(k)
                        args[i] = iwons_tree(args[i]) if kind == 'tree' else iwons_list(args[i]['values'], args[i]['pos']) if kind == 'cycle' else iwons_list(args[i])
                    actual = iwons_output(fn(*args), req.get('outputKind'))
                result['actual'] = json.loads(json.dumps(actual))
                result['passed'] = True
        except Exception as e:
            result['error'] = ''.join(traceback.format_exception_only(type(e),e)).strip()
        result['stdout'] = output.getvalue()[:10000]
        result['runtimeMs'] = (time.perf_counter()-start)*1000
        results.append(result)
    return {'verdict':'runtime_error' if any('error' in r for r in results) else 'accepted', 'cases':results}

json.dumps(iwons_execute(json.loads(iwons_request)))
