import os
import sys
import json

os.environ.setdefault('KAGGLE_CONFIG_DIR', os.path.expanduser('~/.kaggle'))
from kaggle.api.kaggle_api_extended import KaggleApi

api = KaggleApi()
api.authenticate()

queries = [
    'panoramic dental',
    'dental x ray',
    'teeth segmentation',
    'dental caries',
    'dental panoramic detection',
    'opg dental'
]

all_datasets = {}

for q in queries:
    try:
        res = api.dataset_list(search=q)
        for d in res:
            ref = str(d.ref)
            if ref not in all_datasets:
                all_datasets[ref] = {
                    'ref': ref,
                    'title': str(getattr(d, 'title', '')),
                    'subtitle': str(getattr(d, 'subtitle', '')),
                    'size': getattr(d, 'size', 'N/A'),
                    'url': f"https://www.kaggle.com/datasets/{ref}"
                }
    except Exception as e:
        print(f"Error {q}: {e}")

output_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kaggle_dental_datasets.json')
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(list(all_datasets.values()), f, ensure_ascii=False, indent=2)

print(f"Found {len(all_datasets)} datasets saved to {output_file}")
