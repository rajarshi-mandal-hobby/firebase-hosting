const a = {
    '2nd': {
        'member-4': 'Alice Johnson',
        'member-2': 'Jane Smith',
        'member-1': 'John Doe'
    },
    '3rd': {
        'member-3': 'Bob Wilson',
        'member-5': 'Charlie Brown'
    }
};
const b = [
    {
        value: 'member-4',
        label: 'Alice Johnson'
    },
    {
        value: 'member-2',
        label: 'Jane Smith'
    },
    {
        value: 'member-1',
        label: 'John Doe'
    },
    {
        value: 'member-3',
        label: 'Bob Wilson'
    }
];

// From a To { value: 'member-4', label: 'Alice Johnson' }
const obj = Object.values(a).flatMap((i) => Object.entries(i)) as [string, string][];
const bObj = b.map((i) => [i.value, i.label]) as [string, string][];
const merged = [...new Map([...obj, ...bObj])].map(([key, value]) => ({ value: key, label: value }));

console.log(JSON.stringify(merged, null, 2));
