cc.Class({
    extends: cc.Component,

    properties: {
        hit: {
            type: cc.AudioClip,
            default: null
        },
        over: {
            type: cc.AudioClip,
            default: null
        },
        combo: {
            type: [cc.AudioClip],
            default: []
        }
    },

    /**
     * 播放连击音效，参数为0-5
     * @param {number} id 
     */
    playCombo (id) {
        if (id < 0) return;
        if (id > 5) {
            id = 5;
        }
        cc.audioEngine.playEffect(this.combo[id], false);
    },

    /**
     * 播放点击音效
     */
    playHit () {
        cc.audioEngine.playEffect(this.hit, false);
    },

    /**
     * 播放结束音效 (纠正下上期错误)
     */
    playOver () {
        cc.audioEngine.playEffect(this.over, false);
    }

});
