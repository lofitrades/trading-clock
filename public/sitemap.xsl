<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap | Time 2 Trade</title>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            font-size: 14px;
            color: #333;
            background: #f9f9f9;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 20px 30px;
          }
          h1 {
            color: #1a73e8;
            font-size: 24px;
            margin: 0 0 10px 0;
          }
          .description {
            color: #666;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          .description a {
            color: #1a73e8;
            text-decoration: none;
          }
          .stats {
            background: #e8f0fe;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 13px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #f5f5f5;
            text-align: left;
            padding: 12px 10px;
            font-weight: 600;
            border-bottom: 2px solid #ddd;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          tr:hover td {
            background: #f9f9f9;
          }
          .url {
            word-break: break-all;
          }
          .url a {
            color: #1a73e8;
            text-decoration: none;
          }
          .url a:hover {
            text-decoration: underline;
          }
          .priority {
            text-align: center;
          }
          .freq {
            text-align: center;
          }
          .lastmod {
            white-space: nowrap;
          }
          .hreflang {
            font-size: 11px;
            color: #666;
          }
          .hreflang span {
            display: inline-block;
            background: #e8e8e8;
            padding: 2px 6px;
            border-radius: 3px;
            margin: 2px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🗺️ XML Sitemap</h1>
          <p class="description">
            This is an XML sitemap for <a href="https://time2.trade">Time 2 Trade</a>, 
            used by search engines like Google to discover and index pages.
            <a href="https://www.sitemaps.org/">Learn more about sitemaps</a>.
          </p>
          
          <xsl:choose>
            <!-- Sitemap Index -->
            <xsl:when test="sitemap:sitemapindex">
              <div class="stats">
                📊 This sitemap index contains <strong><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></strong> sitemaps.
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Sitemap URL</th>
                    <th class="lastmod">Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                    <tr>
                      <td class="url">
                        <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                      </td>
                      <td class="lastmod">
                        <xsl:value-of select="sitemap:lastmod"/>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:when>
            
            <!-- URL Set -->
            <xsl:otherwise>
              <div class="stats">
                📊 This sitemap contains <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong> URLs.
              </div>
              <table>
                <thead>
                  <tr>
                    <th>URL</th>
                    <th class="priority">Priority</th>
                    <th class="freq">Change Freq</th>
                    <th class="lastmod">Last Modified</th>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="sitemap:urlset/sitemap:url">
                    <tr>
                      <td class="url">
                        <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                        <xsl:if test="xhtml:link">
                          <div class="hreflang">
                            <xsl:for-each select="xhtml:link[@rel='alternate']">
                              <span><xsl:value-of select="@hreflang"/></span>
                            </xsl:for-each>
                          </div>
                        </xsl:if>
                      </td>
                      <td class="priority">
                        <xsl:value-of select="sitemap:priority"/>
                      </td>
                      <td class="freq">
                        <xsl:value-of select="sitemap:changefreq"/>
                      </td>
                      <td class="lastmod">
                        <xsl:value-of select="sitemap:lastmod"/>
                      </td>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>
            </xsl:otherwise>
          </xsl:choose>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
