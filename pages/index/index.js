var Api = require('../../utils/api.js');
var util = require('../../utils/util.js');
var WxParse = require('../../wxParse/wxParse.js');
var app = getApp()

Page({
  data: {
    title: '文章列表',
    postsList: {},
    pagesList: {},
    categoriesList: {},
    postsShowSwiperList: {},


    isLastPage:false,
    
    page: 1,
    search: '',
    categories: 0,

    scrollHeight: 0,

    displayHeader:"none",
    displaySwiper: "block",
    floatDisplay: "none",


  },
  formSubmit: function (e) {
    var url = '../list/list'
    if (e.detail.value.input != '') {
      url = url + '?search=' + e.detail.value.input;
    }
    wx.navigateTo({
      url: url
    })
  },
  onShareAppMessage: function () {
    return {
      title: '金滔的小程序',
      path: 'pages/index/index',
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
        // 转发失败
      }
    }
  },
  onReachBottom: function () {

    //console.log("xialajiazai");  
   
  },
  onLoad: function (options) {
    var self = this;
    if (options.categoryID && options.categoryID != 0) {
      self.setData({
        categories: options.categoryID
      })
    }
    if (options.search && options.search != '') {
      self.setData({
        search: options.search

      })
    }

    this.fetchTopFivePosts();
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function (userInfo) {
      //更新数据
      self.setData({
        userInfo: userInfo
      })

      wx.setStorageSync("userInfo", userInfo)

    });

    wx.getSystemInfo({
      success: function (res) {
        //console.info(res.windowHeight);
        self.setData({
          scrollHeight: res.windowHeight,
          //screenWidth: res.windowWidth,
          slideHeight: res.windowHeight,
          slideRight: res.windowWidth,
          slideWidth: res.windowWidth * 0.7
        });
      }
    });
  },

  
  fetchTopFivePosts: function () {
    var self = this;
    self.setData({
      postsShowSwiperList: []
    });


    //先优先获取置顶的文章
    wx.request({
      url: Api.getStickyPosts(),
      success: function (response) {
        if (response.data.length > 0) {

          self.setData({
            postsShowSwiperList: self.data.postsShowSwiperList.concat(response.data.map(function (item) {
              item.firstImage = Api.getContentFirstImage(item.content.rendered);
              return item;
            }))
          });

          self.fetchPostsData(self.data);
        }

        else {
          self.setData({
            displaySwiper: "none",
            displayHeader:"block"

          });

          self.fetchPostsData(self.data);

        }


      },
      fail: function (response) {
        //var temp = response.data;

      }
    });





  },

  //获取文章列表数据
  fetchPostsData: function (data) {
    var self = this;

    
    if (!data) data = {};
    if (!data.page) data.page = 1;
    if (!data.categories) data.categories = 0;
    if (!data.search) data.search = '';
    if (data.page === 1) {
      self.setData({
        postsList: []
      });
    };

    wx.showLoading({
      title: '加载中',
    })

    wx.request({
      url: Api.getPosts(data),
      success: function (response) {

        if (response.statusCode === 200) {

          //console.log(response);       
          self.setData({
            //postsList: response.data
           
            floatDisplay: "block",
            postsList: self.data.postsList.concat(response.data.map(function (item) {
              //var strSummary = util.removeHTML(item.content.rendered);
              // item.summary = util.cutstr(strSummary, 200, 0);
              var strdate = item.date
              item.firstImage = Api.getContentFirstImage(item.content.rendered);
              item.date = util.cutstr(strdate, 10, 1);
              return item;
            })),

          });


          if (data.page == 1) {
            
            self.fetchCategoriesData();
          }


          setTimeout(function () {
            wx.hideLoading();
            // wx.showToast({
            //   title: '加载完毕',
            //   icon: 'success',
            //   duration: 900
            // })
          }, 900)
         

        }
        else
        {

        
          if (response.data.code =="rest_post_invalid_page_number")
          {

            self.setData({
              isLastPage:true
            });
            wx.showToast({
              title: '没有更多内容',
              mask:false,
              duration: 1500
            });
          }
          else
          {
            wx.showToast({
              title: response.data.message,
              duration: 1500
            })
          }

          

        }



      }
    });
  },
  //底部刷新
  lower: function (e) {
    
    var self = this;
    if (!self.data.isLastPage)
    {
      self.setData({
        page: self.data.page + 1
      });
      console.log('当前页' + self.data.page);
      this.fetchPostsData(self.data);
    }
    else
    {
      wx.showToast({
        title: '没有更多内容',
        mask: false,
        duration: 1000
      });
    }
  },
  //获取页面列表
  fetchPagesData: function () {
    var self = this;
    wx.request({
      url: Api.getPages(),
      success: function (response) {
        self.setData({
          pagesList: response.data
        });
      }
    });
  },

  //获取分类列表
  fetchCategoriesData: function () {
    var self = this;
    wx.request({
      url: Api.getCategories(),
      success: function (response) {
        self.setData({
          categoriesList: response.data
        });
      }
    });
  },


  // 跳转至查看文章详情
  redictDetail: function (e) {
    // console.log('查看文章');
    var id = e.currentTarget.id,
      url = '../detail/detail?id=' + id;
    wx.navigateTo({
      url: url
    })
  },

  //跳转至某分类下的文章列表
  redictIndex: function (e) {
    //console.log('查看某类别下的文章');  
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.item;
    var url = '../list/list?categoryID=' + id + '&categoryName=' + name;
    wx.navigateTo({
      url: url
    });
  },

  //跳转至某分类下的文章列表
  redictHome: function (e) {
    //console.log('查看某类别下的文章');  
    var id = e.currentTarget.dataset.id,
      url = '/pages/index/index';

    wx.switchTab({
      url: url
    });
  },

})


