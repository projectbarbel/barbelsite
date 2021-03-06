/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

class HomeSplash extends React.Component {
  render() {
    const {siteConfig, language = ''} = this.props;
    const {baseUrl, docsUrl} = siteConfig;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

    const SplashContainer = props => (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">{props.children}</div>
        </div>
      </div>
    );

    const Logo = props => (
      <div className="projectLogo">
        <img src={props.img_src} alt="Project Logo" />
      </div>
    );

    const ProjectTitle = () => (
      <h2 className="projectTitle">
        {siteConfig.title}
        <small>{siteConfig.tagline}</small>
      </h2>
    );

    const PromoSection = props => (
      <div className="section promoSection">
        <div className="promoRow">
          <div className="pluginRowBlock">{props.children}</div>
        </div>
      </div>
    );

    const Button = props => (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={props.href} target={props.target}>
          {props.children}
        </a>
      </div>
    );

    return (
      <SplashContainer>
        <Logo img_src={`${baseUrl}img/logo_blau_weiss.png`} />
        <div className="inner">
          <ProjectTitle siteConfig={siteConfig} />
          <PromoSection>
            <Button href={docUrl('getstarted.html')}>Get Started</Button>
            <Button href="https://search.maven.org/artifact/org.projectbarbel/barbelhisto/">Download</Button>
            <Button href="https://github.com/projectbarbel/barbelhisto-core">Github</Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

class Index extends React.Component {
  render() {
    const {config: siteConfig, language = ''} = this.props;
    const {baseUrl} = siteConfig;

    const Block = props => (
      <Container
        padding={['bottom', 'top']}
        id={props.id}
        background={props.background}>
        <GridBlock
          align="center"
          contents={props.children}
          layout={props.layout}
        />
      </Container>
    );

    const FeatureCallout = () => (
      <div
         className="productShowcaseSection paddingBottom"
        style={{textAlign: 'center'}}>
        <h2>Features</h2>
        <MarkdownBlock>
          
        </MarkdownBlock> </div>
    );

    const TryOut = () => (
      <Block id="try">
        {[
          {
            content: 'Talk about trying this out',
            image: `${baseUrl}img/trackchanges.svg`,
            imageAlign: 'left',
            title: 'Keep track of all the changes',
          },
        ]}
      </Block>
    );

    const Description = () => (
      <Block background="light">
        {[
          {
            content:
              'This is another description of how this project is useful',
            image: `${baseUrl}img/usages.svg`,
            imageAlign: 'right',
            title: 'Example use cases',
          },
        ]}
      </Block>
    );

    const LearnHow = () => (
      <Block background="light">
        {[
          {
            content: 'Drive through the documentation to get started. Explore the different use cases of using BarbelHisto Core as your primary bitemporal data management API.',
            image: `${baseUrl}img/howto.svg`,
            imageAlign: 'right',
            title: 'Learn How to use BarbelHisto Core',
          },
        ]}
      </Block>
    );

    const Features = () => (
      <Block layout="threeColumn">
        {[
          {
            content: 'BarbelHisto Core is a Java framework for audit-proof bitemporal data management. It keeps track of two time dimensions: effective time and record time.',
            image: `${baseUrl}img/bitemporal.svg`,
            imageAlign: 'top',
            title: 'Bitemporal data',
          },
          {
            content: 'The core functionality is provided in a very small intuitive API in order to simplify the bi-temporal data processing for the users. ',
            image: `${baseUrl}img/getstarted.svg`,
            imageAlign: 'top',
            title: 'Simple API',
          },
          {
            content: 'Built on proven community frameworks, BarbelHisto can be configured for extremely fast processing scenarios.',
            image: `${baseUrl}img/examples.svg`,
            imageAlign: 'top',
            title: 'Fast processing',
          },
          {
            content: 'Users can extend the functionality of BarbelHisto by using the configuration options and a small event-based extension framework.',
            image: `${baseUrl}img/inmemory.svg`,
            imageAlign: 'top',
            title: 'Extension framework',
          },
          {
            content: 'BarbelHisto provides built-in transactional persistence support options and can be extended to integrate with other external data sources.',
            image: `${baseUrl}img/database.svg`,
            imageAlign: 'top',
            title: 'Persistence support',
          },
        ]}
      </Block>
    );

    const Faces = () => (
      <GridBlock
      align="center"
      contents={[
        {
          content:
            "",
          image: ``,
          imageAlign: 'top',
          imageAlt: '',
          title:
            '',
        },
        {
        },
        {
          content:
            "",
          image: ``,
          imageAlign: 'top',
          imageAlt: '',
          title:
            '',
        }
      ]}
      layout="threeColumn"
    />
);

    const Showcase = () => {
      if ((siteConfig.users || []).length === 0) {
        return null;
      }

      const showcase = siteConfig.users
        .filter(user => user.pinned)
        .map(user => (
          <a href={user.infoLink} key={user.infoLink}>
            <img src={user.image} alt={user.caption} title={user.caption} />
          </a>
        ));

      const pageUrl = page => baseUrl + (language ? `${language}/` : '') + page;

      return (
        <div className="productShowcaseSection paddingBottom">
          <h2>Who is Using This?</h2>
          <p>This project is used by all these people</p>
          <div className="logos">{showcase}</div>
          <div className="more-users">
            <a className="button" href={pageUrl('users.html')}>
              More {siteConfig.title} Users
            </a>
          </div>
        </div>
      );
    };

    return (
      <div>
        <HomeSplash siteConfig={siteConfig} language={language} />
        <div className="mainContainer">
          <Features />
          <Showcase />
          <Faces />
        </div>
      </div>
    );
  }
}
/*
          <FeatureCallout />
          <LearnHow />
          <TryOut />
          <Description />
*/
module.exports = Index;
