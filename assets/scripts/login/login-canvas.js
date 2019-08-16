cc.Class({
    extends: cc.Component,

    properties: {
        startButton: cc.Node
    },

    start () {
        let action = cc.repeatForever(
            cc.sequence(
                cc.rotateBy(0.3, 4),
                cc.rotateBy(0.6, -8),
                cc.rotateBy(0.3, 4),
                cc.delayTime(0.5)
            )
        );

        this.startButton.runAction(action);
    },

    /**
     * 跳转至main场景
     */
    toMainScene () {
        cc.director.loadScene('main');
    }
});
