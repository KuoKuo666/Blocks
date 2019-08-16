cc.Class({
    extends: cc.Component,

    properties: {
        bgm: {
            type: cc.AudioClip,
            default: null
        }
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        //cc.audioEngine.playMusic(this.bgm, true);
        if (!cc.audioEngine.isMusicPlaying()) {
            cc.audioEngine.playMusic(this.bgm, true);
        }
    },

    // update (dt) {},
});
