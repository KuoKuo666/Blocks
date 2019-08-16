cc.Class({
    extends: cc.Component,

    properties: () => ({
        blockPrefab: cc.Prefab,
        blockSpriteFrames: [cc.SpriteFrame],
        mainCanvas: require('main-canvas'),
        musicRoot: require('main-music')
    }),

    onLoad () {
        // 为了表示方块的数字，我们需要二维数组
        // 所以两个二维数组 ， 一个装入数字代表数字， 一个装入节点，用于动画操作
        // 在检测连接时，还要一个间接数组，存入被检测方块标志
        this.init();
        // 对象池
        this.pool = new cc.NodePool();
        // 5*5 = 25 实际上装入25个就够用，但是这里不要装正好，多装几个。
        // 如果在对象池未完成回收期前就创建了就会不够用，而且在创建时会有第二层保险
        for (let i = 0; i < 30; i++) {
            this.pool.put(cc.instantiate(this.blockPrefab));
        }
        // 用于计数
        this.count = 0;
        // 用于记录连击音效
        this.hits = 0;
    },

    start () {
        // 让我们创建方块
        this.gameStart();
        // 测试下
        // this.createBlock(0, 0, 0);
    },

    /**
     * 检测方块周围相同方块，记录于book
     * @param {*} col 
     * @param {*} row 
     * @param {*} num 
     */
    mapForCount (col, row, num) {
        let dir = [[0,1],[1,0],[0,-1],[-1,0]];
        for (let k = 0; k < 4; k++) {
            let i = col + dir[k][0];
            let j = row + dir[k][1];
            // 0 - 6 1-5
            if (i < 1 || i > 5 || j < 1 || j > 5) {
                continue;
            }
            if (this.map[i][j] === num && this.book[i][j] === 0) {
                // console.log('找到相同方块', i, j);
                this.book[i][j] = 1;
                this.count += 1;
                // console.log(this.count);
                this.mapForCount(i, j, num);
            }
        }
    },

    

    /**
     * 将已经标记的方块消除
     * @param {*} col 
     * @param {*} row 
     */
    doActionForBook (col, row) {
        // 分数
        this.mainCanvas.updateScoreLabel(this.count, this.map[col][row]);
        for (let i = 1; i < 6; i++) {
            for (let j = 1; j < 6; j++) {
                if (i === col && j === row) {
                    continue;
                } else if (this.book[i][j] === 1) {
                    this.mapNode[i][j].runAction(
                        cc.sequence(
                            cc.scaleTo(0.15, 0),
                            cc.callFunc(() => {
                                this.pool.put(this.mapNode[i][j]);
                                this.map[i][j] = null;
                                this.mapNode[i][j] = null;
                            }, this)
                        )
                    );
                }
            }
        }
        // 本身操作
        this.mapNode[col][row].runAction(
            cc.sequence(
                cc.scaleTo(0.15, 1.2),
                cc.callFunc(() => {
                    this.blockAddOne(col, row);
                }, this),
                cc.scaleTo(0.15, 1),
                cc.callFunc(() => {
                    // 进行下落
                    this.blockDown();
                }, this)
            )
        );

        // 每一次消除，hp += 1；
        this.mainCanvas.hp += 1;
        this.mainCanvas.updateHpShow(this.mainCanvas.hp);
        // 连击加一
        this.musicRoot.playCombo(this.hits);
        this.hits += 1;
    },

    /**
     * 方块下落
     */
    blockDown () {
        let downFlag = true;
        while (downFlag) {
            downFlag = false;
            for (let i = 1; i < 6; i++) {
                for (let j = 1; j < 5; j++) {
                    if (this.mapNode[i][j] !== null && this.mapNode[i][j+1] === null) {
                        // console.log('找到', i, j);
                        this.mapNode[i][j].runAction(cc.moveBy(0.1, 0, -130));
                        this.mapNode[i][j+1] = this.mapNode[i][j];
                        this.map[i][j+1] = this.map[i][j];
                        this.mapNode[i][j] = null;
                        this.map[i][j] = null;
                        downFlag = true;
                    }
                }
            }
        }
        // 下落之后，我们需要把空补上。
        this.scheduleOnce(this.checkNullBlock, 0.3);
    },

    checkNullBlock () {
        for (let i = 1; i < 6; i++) {
            for (let j = 1; j < 6; j++) {
                if (this.mapNode[i][j] === null) {
                    let num = this.randNum(0, 4);
                    let x = -260 + (i - 1) * 130;
                    let y = 260 - (j - 1) * 130;
                    this.map[i][j] = num;
                    this.mapNode[i][j] = this.createBlock(x, y, num);
                    // 消除时 缩小 0
                    // pool get 
                    this.mapNode[i][j].scale = 0;
                    this.mapNode[i][j].runAction(cc.scaleTo(0.1, 1));
                }
            }
        }
        // 新建方块时间0.1秒
        this.scheduleOnce(this.checkCount, 0.3);
    },

    /**
     * 新建方块后继续检测是否有超过3个方块连接
     */
    checkCount () {
        let checkFlag = true;
        for (let i = 1; i < 6; i++) {
            for (let j = 1; j < 6; j++) {
                if (checkFlag === false) break;
                this.count = 0;
                this.setZeroBook();
                this.mapForCount(i, j, this.map[i][j]);
                if (this.count >= 3) {
                    this.doActionForBook(i, j);
                    checkFlag = false;
                }
            }
        }
        if (checkFlag === true) {
            this.mainCanvas.openTouch();
        }
    },

    /**
     * 点击方块加一
     * @param {*} col 
     * @param {*} row 
     */
    blockAddOne (col, row) {
        if (this.map[col][row] === 8) {
            console.log('到9了');
            return false;
        }
        this.map[col][row] += 1;
        let num = this.map[col][row];
        this.mapNode[col][row].getComponent(cc.Sprite).spriteFrame = this.blockSpriteFrames[num];
        return true;
    },

    gameStart () {
        // 我们需要随机的创建25个方块
        for (let i = 1; i < 6; i++) {
            for (let j = 1; j < 6; j++) {
                // 这里我们要注意坐标转化问题
                // 我们鼠标点击的区域是正方形，而方块的坐标是在那个方形区域中心
                // 宽为 650 左右坐标为 -325 325 那么边界的方块坐标为 -325 + 130/2。。。
                let x = -260 + (i - 1) * 130;
                let y = 260 - (j - 1) * 130;
                // 这样就能遍历到所有方块 ， 随机0-4
                let num = this.randNum(0, 4);
                this.map[i][j] = num;
                // 上下左右均不相同即可
                while (this.map[i][j] === this.map[i-1][j] ||
                       this.map[i][j] === this.map[i][j-1] ||
                       this.map[i][j] === this.map[i+1][j] ||
                       this.map[i][j] === this.map[i][j+1]) {
                           num = this.randNum(0, 4);
                           this.map[i][j] = num;
                       }
                // 这样就不会连着相同了, 创建完的节点存入节点数组
                this.mapNode[i][j] = this.createBlock(x, y, num);
            }
        }
        // console.log(this.map);
        // console.log(this.mapNode);
        // console.log(this.book);
    },

    /**
     * 通过给定坐标和数字创建一个方块
     * @param {number} x 
     * @param {number} y 
     * @param {number} num 
     */
    createBlock (x, y, num) {
        let b = null;
        // 获取前判断对象池是否为空
        if (this.pool.size() > 0) {
            b = this.pool.get(); 
        } else {
            b = cc.instantiate(this.blockPrefab);
        }
        b.parent = this.node;
        b.x = x;
        b.y = y;
        b.getComponent(cc.Sprite).spriteFrame = this.blockSpriteFrames[num];
        return b;
    },

    init () {
        this.map = [];
        this.mapNode = [];
        // 标志数组
        this.book = [];
        // 让我们创建二维数组 在JavaScript中只有1维数组，二维数组就是[[],[],[],,,,,]数组中装入数组
        for (let i = 0; i < 7; i++) {
            this.map[i] = [];
            this.mapNode[i] = [];
            this.book[i] = [];
            for (let j = 0; j < 7; j++) {
                this.map[i][j] = null;
                this.mapNode[i][j] = null;
                this.book[i][j] = 0;
            }
        }
        // 这样，就初始化了3个二维数组，打印看下
        // console.log(this.map);
        // console.log(this.mapNode);
        // console.log(this.book);
    },

    setZeroBook () {
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                this.book[i][j] = 0;
            }
        }
    },

    /**
     * 返回min - max 的随机值
     * @param {number} min 
     * @param {number} max 
     */
    randNum (min, max) {
        let value = min + (max - min + 1) * Math.random();
        return Math.floor(value);
    }
});
