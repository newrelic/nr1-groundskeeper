## What's new in version 2

We’ve updated Agent Groundskeeper to improve user experience to be able to identify out-of-date APM agents and help organize your agent upgrades.

Improvements include

- Identifying whether your currently deployed Application - APM Agent versions contain any critical exposures 
- Quickly understand what capabilities are currently enabled for your Application
- Recommendations for which agent version to upgrade to based on your runtime per Application. Highlighting if you are already at the latest recommended version, if your runtime is out of support and if there is no supported APM Agent version for your runtime. 
- Quickly and easily zoom in on your environment by filtering on tags and searching by account, language and tags.
- Download the application list for project planning

## Usage

Agent Groundskeeper allows you to see the latest agent versions, compared to the versions currently running based on your upgrade SLO.

Quickly and easily zoom in on your environment by filtering on tags and searching by account, language and application.

This application will help you keep up to date with the latest agent versions and benefit from new capabilities being released.

## Open Source License

This project is distributed under the [Apache 2 license](https://github.com/newrelic/nr1-groundskeeper/blob/main/LICENSE).

## Dependencies

Requires [`New Relic APM`](https://newrelic.com/products/application-monitoring).

## Getting started

First, ensure that you have [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [NPM](https://www.npmjs.com/get-npm) installed. If you're unsure whether you have one or both of them installed, run the following command(s) (If you have them installed these commands will return a version number, if not, the commands won't be recognized):

```bash
git --version
npm -v
```

Next, clone this repository and run the following scripts:

```bash
nr1 nerdpack:clone -r https://github.com/newrelic/nr1-groundskeeper.git
cd nr1-groundskeeper
nr1 nerdpack:serve
```

Visit [https://one.newrelic.com/?nerdpacks=local](https://one.newrelic.com/?nerdpacks=local), navigate to the Nerdpack, and :sparkles:

## Deploying this Nerdpack

Open a command prompt in the nerdpack's directory and run the following commands.

```bash
# To create a new uuid for the nerdpack so that you can deploy it to your account:
# nr1 nerdpack:uuid -g [--profile=your_profile_name]

# To see a list of APIkeys / profiles available in your development environment:
# nr1 profiles:list

nr1 nerdpack:publish [--profile=your_profile_name]
nr1 nerdpack:deploy [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
nr1 nerdpack:subscribe [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
```

Visit [https://one.newrelic.com](https://one.newrelic.com), navigate to the Nerdpack, and :sparkles:

## Community Support

New Relic hosts and moderates an online forum where you can interact with New Relic employees as well as other customers to get help and share best practices. Like all New Relic open source community projects, there's a related topic in the New Relic Explorers Hub. You can find this project's topic/threads here:

[https://discuss.newrelic.com/t/groundskeeper-nerdpack/84168](https://discuss.newrelic.com/t/groundskeeper-nerdpack/84168)

Please do not report issues with Agent Groundskeeper to New Relic Global Technical Support. Instead, visit the [`Explorers Hub`](https://discuss.newrelic.com/c/build-on-new-relic) for troubleshooting and best-practices.

## Issues / Enhancement Requests

Issues and enhancement requests can be submitted in the [Issues tab of this repository](https://github.com/newrelic/nr1-groundskeeper/issues). Please search for and review the existing open issues before submitting a new issue.

## Contributing

Contributions are welcome (and if you submit a Enhancement Request, expect to be invited to contribute it yourself :grin:). Please review our [Contributors Guide](https://github.com/newrelic/nr1-groundskeeper/blob/main/CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource@newrelic.com.
