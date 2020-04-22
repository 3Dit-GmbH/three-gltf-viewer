export const makeGovieUI = (viewer) => {
    return {
        toggleUI: (flag) => {
            if (flag && viewer.gui.closed) {
                viewer.gui.open();
            } else if (!flag && !viewer.gui.closed) {
                viewer.gui.close();
            }
        },
    };
};
