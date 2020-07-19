package com.wangxq.esqidi.booksearch.model;

import lombok.Data;

import java.io.Serializable;

/**
 * @Description:
 * @Author: wxq
 * @Date: 2020/7/19 8:43
 * @Version: 1.0
 **/
@Data
public class BookInfo implements Serializable {

    private String id;
    private String image;
    private String title;
    private String typeCodes;
    private String author;

    /*
     * 简介
     */
    private String intro;

    /*
     * 最新更新
     */
    private String update;

    /*
     * 总字数
     */
    private String totalWordNum;
    /*
     * 总推荐数
     */
    private String totalRecommendNum;
}
