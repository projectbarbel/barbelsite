/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary');

const Container = CompLibrary.Container;

const CWD = process.cwd();

const versions = require(`${CWD}/versions.json`);

function Versions(props) {
  const {config: siteConfig} = props;
  
  const {baseUrl, docsUrl} = siteConfig;
  const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
  const docUrl = doc => `${baseUrl}${docsPart}${doc}`;

  const latestVersion = versions[0];
  const repoUrl = `https://github.com/${siteConfig.organizationName}/${
    siteConfig.projectName
  }`;
  return (
    <div className="docMainWrapper wrapper">
      <Container className="mainContainer versionsContainer">
        <div className="post">
          <header className="postHeader">
            <h1>{siteConfig.title} Versions</h1>
          </header>
          <p>New versions of this project are released as often as possible.</p>
          <h3 id="latest">Current version (Stable)</h3>
          <table className="versions">
            <tbody>
              <tr>
                <th>{latestVersion}</th>
                <td>
                  <a href={`apidocs/${latestVersion}/index.html`}>Documentation</a>
                </td>
                <td>
                  <a href={docUrl('releasenotes.html')}>Release Notes</a>
                </td>
              </tr>
            </tbody>
          </table>
          <p>
          </p>
          <h3 id="rc">Pre-release versions</h3>
          <table className="versions">
            <tbody>
              <tr>
                <th>master</th>
                <td>
                  <a href="apidocs/master/index.html">Documentation</a>
                </td>
                <td>
                  <a href={docUrl('snapshotnotes.html')}>Release Notes</a>
                </td>
              </tr>
            </tbody>
          </table>
          <p></p>
          <h3 id="archive">Past Versions</h3>
          <table className="versions">
            <tbody>
              {versions.map(
                version =>
                  version !== latestVersion && (
                    <tr>
                      <th>{version}</th>
                      <td>
                        <a href={`apidocs/${version}/index.html`}>Documentation</a>
                      </td>
                      <td>
                        <a href={`${siteConfig.baseUrl}${siteConfig.docsUrl}/${version}/releasenotes.html`}>Release Notes</a>
                      </td>
                    </tr>
                  ),
              )}
            </tbody>
          </table>
          <p>
            You can find past versions of this project on{' '}
            <a href="https://github.com/projectbarbel/barbelhisto-core">GitHub</a>.
          </p>
        </div>
      </Container>
    </div>
  );
}

module.exports = Versions;
