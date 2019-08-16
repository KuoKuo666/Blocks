// 我们在引入其他脚本时常这么写
// var manager = require('main-blockManager');
// 但是这样存在一个问题，无法互相引用
cc.Class({
    extends: cc.Component,

    // 解决方案，延迟引用，写在属性里，需要修改写法,会了吧
    properties: () => ({
        // 管理5个生命值
        hpManager: cc.Node,
        // 分数显示
        showScoreLabel: cc.Label,
        blockManager: require('main-blockManager'),
        musicRoot: require('main-music')
    }),

    onLoad () {
        this.hp = 5;
        this.score = 0;
    },

    start () {
        this.openTouch();
        // 测试
        this.updateHpShow(this.hp);
    },

    touchEnd (e) {
        this.musicRoot.playHit();
        // 获取下位置
        let pos = this.node.convertToNodeSpaceAR(e.getLocation());
        // 每个方块 空间为 130 * 130 5个方块连一排为 650 宽
        // 所以在坐标转化时是 325  col 行  row 列
        // 加一是因为 5 * 5的空间，我准备采用 7 * 7 的二维数组
        let col = Math.floor((325 + pos.x)/130) + 1;
        let row = Math.floor((325 - pos.y)/130) + 1;
        // console.log(col, row);
        // 如果出界
        if (col < 1 || col > 5 || row < 1 || row > 5) {
            console.log('不在范围内');
            return;
        }
        if (!this.blockManager.blockAddOne(col, row)) {
            return;
        }
        this.hp -= 1;
        if (this.hp < 0) {
            console.log('游戏结束');
            this.musicRoot.playOver();
            this.scheduleOnce(() => {
                cc.director.loadScene('login');
            }, 1);
        }
        this.updateHpShow(this.hp);
        this.closeTouch();
        // 每次检测前都应归零book, count也需要归零
        this.blockManager.count = 0;
        this.blockManager.setZeroBook();
        let num = this.blockManager.map[col][row];
        this.blockManager.mapForCount(col, row, num);
        if (this.blockManager.count < 3) {
            this.openTouch();
            return;
        }
        this.blockManager.hits = 0;
        // this.updateScoreLabel(this.blockManager.count, this.blockManager.map[col][row]);
        this.blockManager.doActionForBook(col, row);
    },

    /**
     * 刷新血量
     */
    updateHpShow (hp) {
        if (hp < 0) hp = 0;
        if (hp > 5) hp = 5;
        for (let i = 0; i < 5; i++) {
            this.hpManager.children[i].opacity = 0;
        }
        for (let i = 0; i < hp; i++) {
            this.hpManager.children[i].opacity = 255;
        }
    },

    /**
     * 分数增加，传入消除的数量与消除方块的数
     * 例子：我们消除了3个1 3* 1  4个2 4*2
     */
    updateScoreLabel (num, k) {
        this.showScoreLabel.node.runAction(cc.sequence(
            cc.scaleTo(0.1, 1.2),
            cc.callFunc(() => {
                this.score += (k + 1) * num;
                this.showScoreLabel.string = this.score + "";
            }, this),
            cc.scaleTo(0.1, 1)
        ));
    },

    /**
     * 打开触摸
     */
    openTouch () {
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    },

    /**
     * 关闭触摸
     */
    closeTouch () {
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    }
});
