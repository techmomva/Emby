﻿define(['dialogHelper', 'connectionManager', 'loading', 'dom', 'layoutManager', 'globalize', 'scrollHelper', 'require', 'cardStyle', 'formDialogStyle', 'emby-button', 'paper-icon-button-light'], function (dialogHelper, connectionManager, loading, dom, layoutManager, globalize, scrollHelper, require) {

    var currentItem;
    var hasChanges = false;

    function getBaseRemoteOptions() {

        var options = {};

        options.itemId = currentItem.Id;

        return options;
    }

    function reload(page, item) {

        loading.show();

        var apiClient;

        if (item) {
            apiClient = connectionManager.getApiClient(item.ServerId);
            reloadItem(page, item, apiClient);
        }
        else {

            apiClient = connectionManager.getApiClient(currentItem.ServerId);
            apiClient.getItem(apiClient.getCurrentUserId(), currentItem.Id).then(function (item) {
                reloadItem(page, item, apiClient);
            });
        }
    }

    function addListeners(elems, eventName, fn) {

        for (var i = 0, length = elems.length; i < length; i++) {

            elems[i].addEventListener(eventName, fn);
        }
    }

    function reloadItem(page, item, apiClient) {

        currentItem = item;

        apiClient.getRemoteImageProviders(getBaseRemoteOptions()).then(function (providers) {

            var btnBrowseAllImages = page.querySelectorAll('.btnBrowseAllImages');
            for (var i = 0, length = btnBrowseAllImages.length; i < length; i++) {

                if (providers.length) {
                    btnBrowseAllImages[i].classList.remove('hide');
                } else {
                    btnBrowseAllImages[i].classList.add('hide');
                }
            }


            apiClient.getItemImageInfos(currentItem.Id).then(function (imageInfos) {

                renderStandardImages(page, apiClient, item, imageInfos, providers);
                renderBackdrops(page, apiClient, item, imageInfos, providers);
                renderScreenshots(page, apiClient, item, imageInfos, providers);
                loading.hide();
            });
        });
    }

    function getImageUrl(item, apiClient, type, index, options) {

        options = options || {};
        options.type = type;
        options.index = index;

        if (type == 'Backdrop') {
            options.tag = item.BackdropImageTags[index];
        } else if (type == 'Screenshot') {
            options.tag = item.ScreenshotImageTags[index];
        } else if (type == 'Primary') {
            options.tag = item.PrimaryImageTag || item.ImageTags[type];
        } else {
            options.tag = item.ImageTags[type];
        }

        // For search hints
        return apiClient.getScaledImageUrl(item.Id || item.ItemId, options);

    }


    function getCardHtml(image, index, apiClient, imageProviders, imageSize, tagName, enableFooterButtons) {

        var html = '';

        var cssClass = "card scalableCard";
        cssClass += " midBackdropCard midBackdropCard-scalable";

        if (tagName == 'button') {
            html += '<button type="button" class="' + cssClass + '">';
        } else {
            html += '<div class="' + cssClass + '">';
        }

        html += '<div class="cardBox visualCardBox">';
        html += '<div class="cardScalable visualCardBox-cardScalable" style="background-color:transparent;">';
        html += '<div class="cardPadder-backdrop"></div>';

        html += '<div class="cardContent">';

        var imageUrl = getImageUrl(currentItem, apiClient, image.ImageType, image.ImageIndex, { maxWidth: imageSize });

        html += '<div class="cardImageContainer" style="background-image:url(\'' + imageUrl + '\');background-position:center bottom;"></div>';

        html += '</div>';
        html += '</div>';

        html += '<div class="cardFooter visualCardBox-cardFooter">';

        html += '<h3 class="cardText cardTextCentered" style="margin:0;">' + image.ImageType + '</h3>';

        html += '<div class="cardText cardText-secondary cardTextCentered">';
        if (image.Width && image.Height) {
            html += image.Width + ' X ' + image.Height;
        } else {
            html += '&nbsp;';
        }
        html += '</div>';

        if (enableFooterButtons) {
            html += '<div class="cardText cardTextCentered">';

            if (image.ImageType == "Backdrop" || image.ImageType == "Screenshot") {

                if (index > 0) {
                    html += '<button is="paper-icon-button-light" class="btnMoveImage autoSize" data-imagetype="' + image.ImageType + '" data-index="' + image.ImageIndex + '" data-newindex="' + (image.ImageIndex - 1) + '" title="' + globalize.translate('sharedcomponents#MoveLeft') + '"><i class="md-icon">chevron_left</i></button>';
                } else {
                    html += '<button is="paper-icon-button-light" class="autoSize" disabled title="' + globalize.translate('sharedcomponents#MoveLeft') + '"><i class="md-icon">chevron_left</i></button>';
                }

                if (index < length - 1) {
                    html += '<button is="paper-icon-button-light" class="btnMoveImage autoSize" data-imagetype="' + image.ImageType + '" data-index="' + image.ImageIndex + '" data-newindex="' + (image.ImageIndex + 1) + '" title="' + globalize.translate('sharedcomponents#MoveRight') + '"><i class="md-icon">chevron_right</i></button>';
                } else {
                    html += '<button is="paper-icon-button-light" class="autoSize" disabled title="' + globalize.translate('sharedcomponents#MoveRight') + '"><i class="md-icon">chevron_right</i></button>';
                }
            }
            else {
                if (imageProviders.length) {
                    html += '<button is="paper-icon-button-light" data-imagetype="' + image.ImageType + '" class="btnSearchImages autoSize" title="' + globalize.translate('sharedcomponents#Search') + '"><i class="md-icon">search</i></button>';
                }
            }

            html += '<button is="paper-icon-button-light" data-imagetype="' + image.ImageType + '" data-index="' + (image.ImageIndex != null ? image.ImageIndex : "null") + '" class="btnDeleteImage autoSize" title="' + globalize.translate('sharedcomponents#Delete') + '"><i class="md-icon">delete</i></button>';
            html += '</div>';
        }

        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</' + tagName + '>';

        return html;
    }

    function renderImages(page, item, apiClient, images, imageProviders, elem) {

        var html = '';

        var imageSize = 300;
        var windowSize = dom.getWindowSize();
        if (windowSize.innerWidth >= 1280) {
            imageSize = Math.round(windowSize.innerWidth / 4);
        }

        var tagName = layoutManager.tv ? 'button' : 'div';
        var enableFooterButtons = !layoutManager.tv;

        for (var i = 0, length = images.length; i < length; i++) {

            var image = images[i];

            html += getCardHtml(image, i, apiClient, imageProviders, imageSize, tagName, enableFooterButtons);
        }

        elem.innerHTML = html;
        ImageLoader.lazyChildren(elem);

        addListeners(elem.querySelectorAll('.btnSearchImages'), 'click', function () {
            showImageDownloader(page, this.getAttribute('data-imagetype'));
        });

        addListeners(elem.querySelectorAll('.btnDeleteImage'), 'click', function () {
            var type = this.getAttribute('data-imagetype');
            var index = this.getAttribute('data-index');
            index = index == "null" ? null : parseInt(index);

            require(['confirm'], function (confirm) {

                confirm(globalize.translate('sharedcomponents#ConfirmDeleteImage')).then(function () {

                    ApiClient.deleteItemImage(currentItem.Id, type, index).then(function () {

                        hasChanges = true;
                        reload(page);

                    });
                });
            });
        });

        addListeners(elem.querySelectorAll('.btnMoveImage'), 'click', function () {
            var type = this.getAttribute('data-imagetype');
            var index = parseInt(this.getAttribute('data-index'));
            var newIndex = parseInt(this.getAttribute('data-newindex'));
            ApiClient.updateItemImageIndex(currentItem.Id, type, index, newIndex).then(function () {

                hasChanges = true;
                reload(page);

            });
        });
    }

    function renderStandardImages(page, apiClient, item, imageInfos, imageProviders) {

        var images = imageInfos.filter(function (i) {
            return i.ImageType != "Screenshot" && i.ImageType != "Backdrop" && i.ImageType != "Chapter";
        });

        renderImages(page, item, apiClient, images, imageProviders, page.querySelector('#images'));
    }

    function renderBackdrops(page, apiClient, item, imageInfos, imageProviders) {

        var images = imageInfos.filter(function (i) {
            return i.ImageType == "Backdrop";

        }).sort(function (a, b) {
            return a.ImageIndex - b.ImageIndex;
        });

        if (images.length) {
            page.querySelector('#backdropsContainer', page).classList.remove('hide');
            renderImages(page, item, apiClient, images, imageProviders, page.querySelector('#backdrops'));
        } else {
            page.querySelector('#backdropsContainer', page).classList.add('hide');
        }
    }

    function renderScreenshots(page, apiClient, item, imageInfos, imageProviders) {

        var images = imageInfos.filter(function (i) {
            return i.ImageType == "Screenshot";

        }).sort(function (a, b) {
            return a.ImageIndex - b.ImageIndex;
        });

        if (images.length) {
            page.querySelector('#screenshotsContainer', page).classList.remove('hide');
            renderImages(page, item, apiClient, images, imageProviders, page.querySelector('#screenshots'));
        } else {
            page.querySelector('#screenshotsContainer', page).classList.add('hide');
        }
    }

    function showImageDownloader(page, imageType) {
        require(['components/imagedownloader/imagedownloader'], function (ImageDownloader) {

            ImageDownloader.show(currentItem.Id, currentItem.Type, imageType).then(function () {

                hasChanges = true;
                reload(page);
            });
        });
    }

    function initEditor(page, options) {

        addListeners(page.querySelectorAll('.btnOpenUploadMenu'), 'click', function () {
            var imageType = this.getAttribute('data-imagetype');

            require(['components/imageuploader/imageuploader'], function (imageUploader) {

                imageUploader.show(currentItem.Id, {

                    theme: options.theme,
                    imageType: imageType

                }).then(function (hasChanged) {

                    if (hasChanged) {
                        hasChanges = true;
                        reload(page);
                    }
                });
            });
        });

        addListeners(page.querySelectorAll('.btnBrowseAllImages'), 'click', function () {
            showImageDownloader(page, this.getAttribute('data-imagetype') || 'Primary');
        });
    }

    function showEditor(options, resolve, reject) {

        var itemId = options.itemId;
        var serverId = options.serverId;

        loading.show();

        require(['text!./imageeditor.template.html'], function (template) {
            var apiClient = connectionManager.getApiClient(serverId);
            apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function (item) {

                var dialogOptions = {
                    removeOnClose: true
                };

                if (layoutManager.tv) {
                    dialogOptions.size = 'fullscreen';
                } else {
                    dialogOptions.size = 'fullscreen-border';
                }

                var dlg = dialogHelper.createDialog(dialogOptions);

                dlg.classList.add('formDialog');

                dlg.innerHTML = globalize.translateDocument(template, 'sharedcomponents');
                dlg.querySelector('.formDialogHeaderTitle').innerHTML = item.Name;

                document.body.appendChild(dlg);

                if (layoutManager.tv) {
                    scrollHelper.centerFocus.on(dlg, false);
                }

                initEditor(dlg, options);

                // Has to be assigned a z-index after the call to .open() 
                dlg.addEventListener('close', function () {

                    if (layoutManager.tv) {
                        scrollHelper.centerFocus.off(dlg, false);
                    }

                    loading.hide();

                    if (hasChanges) {
                        resolve();
                    } else {
                        reject();
                    }
                });

                dialogHelper.open(dlg);

                reload(dlg, item);

                dlg.querySelector('.btnCancel').addEventListener('click', function () {

                    dialogHelper.close(dlg);
                });
            });
        });
    }

    return {
        show: function (options) {

            return new Promise(function (resolve, reject) {

                hasChanges = false;

                showEditor(options, resolve, reject);
            });
        }
    };
});