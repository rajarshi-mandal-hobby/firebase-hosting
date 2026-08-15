const a = {
    0: {
        msg: 'hello'
    }
};

const b = { ...a['1'] };

console.log(b.msg);
