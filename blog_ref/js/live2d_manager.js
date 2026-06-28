/**
 * Live2D 看板娘 - 基于 imuncle/live2d Cubism 3.0
 * 全局存活，不受页面切换影响
 */
(function () {
    if (window._kanbanInit) return;
    window._kanbanInit = true;

    var charNames = Object.keys(charData);
    if (!charNames.length) return;

    var charIndex = 0;
    var basePath = '/blog_ref/live2d/model/';
    var l2d = new L2D(basePath);

    var baseCanvasW = 300;
    var baseCanvasH = 450;
    var modelScale = 0.1;
    var modelOffsetX = 0;
    var modelOffsetY = 0;

    var wrapper = document.createElement('div');
    wrapper.id = 'kanban-wrapper';
    wrapper.style.cssText = 'position:fixed;left:0;bottom:0;z-index:1000;pointer-events:auto;';
    document.body.appendChild(wrapper);

    var canvasWrap = document.createElement('div');
    canvasWrap.id = 'kanban-canvas-wrap';
    canvasWrap.style.cssText = 'position:relative;display:inline-block;';
    wrapper.appendChild(canvasWrap);

    var app = new PIXI.Application(baseCanvasW, baseCanvasH, { transparent: true });
    var view = app.view;
    view.id = 'kanban-canvas';
    view.style.display = 'block';
    view.style.cursor = 'pointer';
    canvasWrap.appendChild(view);

    var gearBtn = document.createElement('button');
    gearBtn.id = 'kanban-gear-btn';
    gearBtn.innerHTML = '&#9881;';
    gearBtn.title = 'Live2D 设置';
    gearBtn.style.cssText = 'position:absolute;top:8px;right:8px;z-index:1002;width:28px;height:28px;border-radius:50%;' +
        'background:rgba(0,0,0,0.5);color:#fff;border:1px solid rgba(255,255,255,0.2);font-size:14px;' +
        'cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;' +
        'transition:background 0.2s;';
    gearBtn.addEventListener('mouseenter', function () { gearBtn.style.background = 'rgba(168,130,255,0.5)'; });
    gearBtn.addEventListener('mouseleave', function () { gearBtn.style.background = 'rgba(0,0,0,0.5)'; });
    canvasWrap.appendChild(gearBtn);

    var settingsPanel = document.createElement('div');
    settingsPanel.id = 'kanban-settings';
    settingsPanel.style.cssText = 'position:absolute;top:40px;right:8px;z-index:1002;width:200px;' +
        'background:rgba(20,20,45,0.9);border:1px solid rgba(255,255,255,0.12);border-radius:10px;' +
        'padding:12px;color:#ccc;font-size:12px;display:none;' +
        'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);' +
        'box-shadow:0 8px 32px rgba(0,0,0,0.4);';
    canvasWrap.appendChild(settingsPanel);

    function buildSettingsPanel() {
        settingsPanel.innerHTML = '';

        function addSlider(label, min, max, step, value, onChange) {
            var row = document.createElement('div');
            row.style.cssText = 'margin-bottom:8px;';

            var lbl = document.createElement('div');
            lbl.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:2px;';
            var nameSpan = document.createElement('span');
            nameSpan.textContent = label;
            var valSpan = document.createElement('span');
            valSpan.style.color = '#a882ff';
            valSpan.textContent = value;
            lbl.appendChild(nameSpan);
            lbl.appendChild(valSpan);

            var input = document.createElement('input');
            input.type = 'range';
            input.min = min;
            input.max = max;
            input.step = step;
            input.value = value;
            input.style.cssText = 'width:100%;height:4px;-webkit-appearance:none;appearance:none;' +
                'background:rgba(255,255,255,0.15);border-radius:2px;outline:none;cursor:pointer;';
            input.addEventListener('input', function () {
                valSpan.textContent = parseFloat(this.value).toFixed(step < 1 ? 2 : 0);
                onChange(parseFloat(this.value));
            });

            row.appendChild(lbl);
            row.appendChild(input);
            return row;
        }

        settingsPanel.appendChild(addSlider('模型 X 偏移', -200, 200, 5, modelOffsetX, function (v) {
            modelOffsetX = v;
            applyModelPosition();
        }));

        settingsPanel.appendChild(addSlider('模型 Y 偏移', -200, 200, 5, modelOffsetY, function (v) {
            modelOffsetY = v;
            applyModelPosition();
        }));

        settingsPanel.appendChild(addSlider('模型缩放', 0.02, 0.2, 0.01, modelScale, function (v) {
            modelScale = v;
            applyModelScale();
        }));

        var resetBtn = document.createElement('button');
        resetBtn.textContent = '重置';
        resetBtn.style.cssText = 'width:100%;padding:4px;margin-top:4px;background:rgba(255,255,255,0.08);' +
            'color:#ccc;border:1px solid rgba(255,255,255,0.15);border-radius:6px;cursor:pointer;font-size:12px;';
        resetBtn.addEventListener('mouseenter', function () { resetBtn.style.background = 'rgba(168,130,255,0.3)'; });
        resetBtn.addEventListener('mouseleave', function () { resetBtn.style.background = 'rgba(255,255,255,0.08)'; });
        resetBtn.addEventListener('click', function () {
            modelOffsetX = 0;
            modelOffsetY = 0;
            modelScale = 0.1;
            applyModelPosition();
            applyModelScale();
            buildSettingsPanel();
        });
        settingsPanel.appendChild(resetBtn);
    }

    function applyModelScale() {
        if (model) {
            model.scale = new PIXI.Point(baseCanvasW * modelScale, baseCanvasW * modelScale);
        }
    }

    function applyModelPosition() {
        if (model) {
            model.position = new PIXI.Point(baseCanvasW * 0.5 + modelOffsetX, baseCanvasH * 0.5 + modelOffsetY);
        }
    }

    var settingsOpen = false;
    gearBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        settingsOpen = !settingsOpen;
        if (settingsOpen) {
            buildSettingsPanel();
            settingsPanel.style.display = 'block';
        } else {
            settingsPanel.style.display = 'none';
        }
    });

    document.addEventListener('click', function (e) {
        if (settingsOpen && !settingsPanel.contains(e.target) && e.target !== gearBtn) {
            settingsOpen = false;
            settingsPanel.style.display = 'none';
        }
    });

    var model = null;
    var isClick = false;
    var pointerX = 0;
    var pointerY = 0;
    var loadingModel = null;

    function loadChar(name) {
        var charPath = charData[name];
        if (loadingModel === charPath) return;
        loadingModel = charPath;
        l2d.load(charPath, {
            changeCanvas: function (m) {
                app.stage.removeChildren();
                model = m;
                model.update = onUpdate;
                model.animator.addLayer('base', LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE, 1);
                model.position = new PIXI.Point(baseCanvasW * 0.5 + modelOffsetX, baseCanvasH * 0.5 + modelOffsetY);
                model.scale = new PIXI.Point(baseCanvasW * modelScale, baseCanvasW * modelScale);
                app.stage.addChild(model);
                app.stage.addChild(model.masks);
                loadingModel = null;
            }
        });
    }

    function startAnimation(motionId, layerId) {
        if (!model) return;
        var m = model.motions.get(motionId);
        if (!m) return;
        var l = model.animator.getLayer(layerId);
        if (!l) return;
        l.play(m);
    }

    function isHit(id, posX, posY) {
        if (!model) return false;
        var mesh = model.getModelMeshById(id);
        if (!mesh) return false;
        var vertices = mesh.vertices;
        var left = vertices[0], right = vertices[0];
        var top = vertices[1], bottom = vertices[1];
        for (var i = 1; i < 4; ++i) {
            var x = vertices[i * 2];
            var y = vertices[i * 2 + 1];
            if (x < left) left = x;
            if (x > right) right = x;
            if (y < top) top = y;
            if (y > bottom) bottom = y;
        }
        var mouse_x = mesh.worldTransform.tx - posX;
        var mouse_y = mesh.worldTransform.ty - posY;
        var tx = -mouse_x / mesh.worldTransform.a;
        var ty = -mouse_y / mesh.worldTransform.d;
        return (left <= tx && tx <= right && top <= ty && ty <= bottom);
    }

    function onUpdate(delta) {
        var dt = 0.016 * delta;
        if (!this.animator.isPlaying) {
            var m = this.motions.get('idle');
            if (m) this.animator.getLayer('base').play(m);
        }
        this._animator.updateAndEvaluate(dt);

        this.addParameterValueById('ParamAngleX', pointerX * 30);
        this.addParameterValueById('ParamAngleY', -pointerY * 30);
        this.addParameterValueById('ParamBodyAngleX', pointerX * 10);
        this.addParameterValueById('ParamBodyAngleY', -pointerY * 10);
        this.addParameterValueById('ParamEyeBallX', pointerX);
        this.addParameterValueById('ParamEyeBallY', -pointerY);

        if (this._physicsRig) {
            this._physicsRig.updateAndEvaluate(dt);
        }
        this._coreModel.update();

        var sort = false;
        for (var i = 0; i < this._meshes.length; ++i) {
            this._meshes[i].alpha = this._coreModel.drawables.opacities[i];
            this._meshes[i].visible = Live2DCubismCore.Utils.hasIsVisibleBit(this._coreModel.drawables.dynamicFlags[i]);
            if (Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(this._coreModel.drawables.dynamicFlags[i])) {
                this._meshes[i].vertices = this._coreModel.drawables.vertexPositions[i];
                this._meshes[i].dirtyVertex = true;
            }
            if (Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(this._coreModel.drawables.dynamicFlags[i])) {
                sort = true;
            }
        }
        if (sort) {
            this.children.sort(function (a, b) {
                var ai = this._meshes.indexOf(a);
                var bi = this._meshes.indexOf(b);
                return this._coreModel.drawables.renderOrders[ai] - this._coreModel.drawables.renderOrders[bi];
            }.bind(this));
        }
    }

    function toInternalX(visualX) {
        return visualX * (baseCanvasW / view.offsetWidth);
    }

    function toInternalY(visualY) {
        return visualY * (baseCanvasH / view.offsetHeight);
    }

    view.addEventListener('mousedown', function (e) {
        isClick = true;
    });

    view.addEventListener('mousemove', function (e) {
        if (isClick) {
            isClick = false;
        }
        if (model) {
            var ix = toInternalX(e.offsetX);
            var iy = toInternalY(e.offsetY);
            pointerX = -(model.position.x - ix) / baseCanvasH;
            pointerY = -(model.position.y - iy) / baseCanvasW;
        }
    });

    function isOnModel(ix, iy) {
        if (!model) return false;
        var bounds = model.getBounds();
        var sx = ix * (view.offsetWidth / baseCanvasW);
        var sy = iy * (view.offsetHeight / baseCanvasH);
        return sx >= bounds.x && sx <= bounds.x + bounds.width &&
               sy >= bounds.y && sy <= bounds.y + bounds.height;
    }

    view.addEventListener('mouseup', function (e) {
        if (!model) { isClick = false; return; }
        if (isClick) {
            var ix = toInternalX(e.offsetX);
            var iy = toInternalY(e.offsetY);
            if (isHit('TouchHead', ix, iy)) {
                startAnimation('touch_head', 'base');
            } else if (isHit('TouchSpecial', ix, iy)) {
                startAnimation('touch_special', 'base');
            } else if (isOnModel(ix, iy)) {
                var bodyMotions = ['touch_body', 'main_1', 'main_2', 'main_3', 'mission', 'home', 'mail', 'login', 'complete'];
                var found = null;
                for (var i = 0; i < bodyMotions.length; i++) {
                    if (model.motions.get(bodyMotions[i])) {
                        found = bodyMotions[i];
                        break;
                    }
                }
                if (found) startAnimation(found, 'base');
            }
        }
        isClick = false;
    });

    view.addEventListener('touchstart', function (e) {
        isClick = true;
        e.preventDefault();
    });

    view.addEventListener('touchmove', function (e) {
        if (model) {
            var t = e.touches[0];
            var rect = view.getBoundingClientRect();
            var ix = toInternalX(t.clientX - rect.left);
            var iy = toInternalY(t.clientY - rect.top);
            pointerX = -(model.position.x - ix) / baseCanvasH;
            pointerY = -(model.position.y - iy) / baseCanvasW;
        }
        isClick = false;
    });

    view.addEventListener('touchend', function (e) {
        if (!model) { isClick = false; return; }
        if (isClick) {
            var t = e.changedTouches[0];
            var rect = view.getBoundingClientRect();
            var ix = toInternalX(t.clientX - rect.left);
            var iy = toInternalY(t.clientY - rect.top);
            if (isHit('TouchHead', ix, iy)) {
                startAnimation('touch_head', 'base');
            } else if (isHit('TouchSpecial', ix, iy)) {
                startAnimation('touch_special', 'base');
            } else if (isOnModel(ix, iy)) {
                var bodyMotions = ['touch_body', 'main_1', 'main_2', 'main_3', 'mission', 'home', 'mail', 'login', 'complete'];
                var found = null;
                for (var i = 0; i < bodyMotions.length; i++) {
                    if (model.motions.get(bodyMotions[i])) {
                        found = bodyMotions[i];
                        break;
                    }
                }
                if (found) startAnimation(found, 'base');
            }
        }
        isClick = false;
    });

    var dragInfo = null;
    wrapper.addEventListener('mousedown', function (e) {
        if (e.target === view || e.target.closest('#kanban-settings') || e.target.closest('#kanban-gear-btn') || e.target.closest('#kanban-resize-handle')) return;
        dragInfo = { x: e.clientX - wrapper.offsetLeft, y: e.clientY - wrapper.offsetTop };
        e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
        if (!dragInfo) return;
        wrapper.style.left = (e.clientX - dragInfo.x) + 'px';
        wrapper.style.bottom = 'auto';
        wrapper.style.top = (e.clientY - dragInfo.y) + 'px';
    });
    document.addEventListener('mouseup', function () {
        dragInfo = null;
    });
    wrapper.addEventListener('touchstart', function (e) {
        if (e.target === view || e.target.closest('#kanban-settings') || e.target.closest('#kanban-gear-btn') || e.target.closest('#kanban-resize-handle')) return;
        var t = e.touches[0];
        dragInfo = { x: t.clientX - wrapper.offsetLeft, y: t.clientY - wrapper.offsetTop };
    });
    document.addEventListener('touchmove', function (e) {
        if (!dragInfo) return;
        var t = e.touches[0];
        wrapper.style.left = (t.clientX - dragInfo.x) + 'px';
        wrapper.style.bottom = 'auto';
        wrapper.style.top = (t.clientY - dragInfo.y) + 'px';
    });
    document.addEventListener('touchend', function () {
        dragInfo = null;
    });

    var resizeHandle = document.createElement('div');
    resizeHandle.id = 'kanban-resize-handle';
    resizeHandle.innerHTML = '&#9660;';
    resizeHandle.style.cssText = 'position:absolute;right:0;bottom:0;width:22px;height:22px;' +
        'cursor:nwse-resize;color:rgba(255,255,255,0.5);font-size:12px;' +
        'display:flex;align-items:flex-end;justify-content:flex-end;padding:0 2px 2px 0;' +
        'z-index:1002;pointer-events:auto;';
    canvasWrap.appendChild(resizeHandle);

    var resizeInfo = null;
    var minW = 120, minH = 180, maxW = 800, maxH = 1200;

    resizeHandle.addEventListener('mousedown', function (e) {
        resizeInfo = { startX: e.clientX, startY: e.clientY, startW: view.offsetWidth, startH: view.offsetHeight };
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('mousemove', function (e) {
        if (!resizeInfo) return;
        var newW = Math.max(minW, Math.min(maxW, resizeInfo.startW + (e.clientX - resizeInfo.startX)));
        var ratio = baseCanvasH / baseCanvasW;
        var newH = newW * ratio;
        if (newH > maxH) { newH = maxH; newW = newH / ratio; }
        if (newH < minH) { newH = minH; newW = newH / ratio; }
        view.style.width = newW + 'px';
        view.style.height = newH + 'px';
    });

    document.addEventListener('mouseup', function () {
        resizeInfo = null;
    });

    resizeHandle.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        resizeInfo = { startX: t.clientX, startY: t.clientY, startW: view.offsetWidth, startH: view.offsetHeight };
        e.preventDefault();
        e.stopPropagation();
    });

    document.addEventListener('touchmove', function (e) {
        if (!resizeInfo) return;
        var t = e.touches[0];
        var newW = Math.max(minW, Math.min(maxW, resizeInfo.startW + (t.clientX - resizeInfo.startX)));
        var ratio = baseCanvasH / baseCanvasW;
        var newH = newW * ratio;
        if (newH > maxH) { newH = maxH; newW = newH / ratio; }
        if (newH < minH) { newH = minH; newW = newH / ratio; }
        view.style.width = newW + 'px';
        view.style.height = newH + 'px';
    });

    document.addEventListener('touchend', function () {
        resizeInfo = null;
    });

    app.ticker.add(function (dt) {
        if (!model) return;
        model.update(dt);
        model.masks.update(app.renderer);
    });

    for (var i = 0; i < charNames.length; i++) {
        if (charNames[i] === 'Laffey') { charIndex = i; break; }
    }
    loadChar(charNames[charIndex]);
})();