"""Measure the four requested meshes and their actual referenced vertices."""
from pathlib import Path
import json
import numpy as np

root=Path(__file__).resolve().parents[1]
names=['price-of-power','liberty-tug-of-war (1)','capitol-at-auction','capitol-marionette']
result=[]
for name in names:
    vertices=[]; parts=[]; part=None
    for line in (root/'obj'/f'{name}.obj').read_text().splitlines():
        fields=line.split()
        if not fields: continue
        if fields[0]=='v': vertices.append([float(x) for x in fields[1:4]])
        elif fields[0]=='o':
            part={'name':' '.join(fields[1:]),'indices':set(),'triangles':0};parts.append(part)
        elif fields[0]=='f':
            if part is None: part={'name':'default','indices':set(),'triangles':0};parts.append(part)
            indices=[int(v.split('/')[0]) for v in fields[1:]]
            part['indices'].update(i-1 if i>0 else len(vertices)+i for i in indices)
            part['triangles']+=len(indices)-2
    vertices=np.asarray(vertices)
    for part in parts:
        points=vertices[list(part.pop('indices'))]
        part['min']=points.min(axis=0).tolist();part['max']=points.max(axis=0).tolist()
    item={'id':name,'min':vertices.min(axis=0).tolist(),'max':vertices.max(axis=0).tolist(),
          'triangles':sum(p['triangles'] for p in parts),'parts':parts}
    result.append(item)
    print(name,'bounds',item['min'],item['max'],'parts',len(parts),'triangles',item['triangles'])
    for part in parts:
        if part['name'] in ['torch_flame','pedestal_base','waist_rope','dome_shell','hand_0_palm','main_block']:
            print('  ',part['name'],part['min'],part['max'])
(root/'film/output/geometry-analysis.json').write_text(json.dumps(result,indent=2)+'\n')
