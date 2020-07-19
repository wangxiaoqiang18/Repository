package com.wangxq.esqidi.booksearch.model;

import lombok.Data;

import java.io.Serializable;

/**
 * @Description:
 * @Author: wxq
 * @Date: 2020/7/19 9:42
 * @Version: 1.0
 **/
public class PageInfo implements Serializable {

    private int pageSize;
    private int pageIndex;
    private int total;

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public int getPageIndex() {
        return pageIndex;
    }

    public void setPageIndex(int pageIndex) {
        this.pageIndex = pageIndex;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }
}
