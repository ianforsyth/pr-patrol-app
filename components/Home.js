import React from 'react'
import axios from 'axios'
import queryString from 'query-string'
import cookie from 'react-cookies'
import Repo from './Repo'
import UserService from '../networking/UserService'
import RepoService from '../networking/RepoService'
import GithubRepoService from '../networking/GithubRepoService'
import _ from 'lodash'

class Home extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      repo_options: [],
      repos: [],
      userIsAuthorized: typeof cookie.load('pr_patrol') != 'undefined',
      githubRedirectCode: queryString.parse(this.props.location.search).code
    }

    this.fetchGithubRepos = this.fetchGithubRepos.bind(this)
  }

  componentWillMount() {
    if(this.state.userIsAuthorized) {
      this.fetchReposAndPatrols()
    } else if(this.state.githubRedirectCode) {
      this.getUser()
    }
  }

  fetchReposAndPatrols() {
    RepoService.fetch().then((data) => {
      this.setState({ repos: data })
    })
  }

  fetchGithubRepos() {
    GithubRepoService.fetch().then((data) => {
      let existingRepoGithubIds = _.map(this.state.repos, 'githubId')
      this.setState({ repo_options: _.filter(data, (repo) => !_.includes(existingRepoGithubIds, repo.id)) })
    })
  }

  getUser() {
    UserService.create({
      code: this.state.githubRedirectCode,
    }).then((data) => {
      cookie.save('pr_patrol', data.appAuthToken)
      this.fetchReposAndPatrols() //single responsibility dude!
    })
  }

  handleCreateRepo(id, name) {
    RepoService.create({
      github_id: id,
      name: name
    }).then((data) => {
      this.setState({ repos: _.concat(this.state.repos, data) })
    })
  }

  handleDeleteRepo(repo) {
    RepoService.delete(repo.id).then(() => {
      this.setState({ repos: _.without(this.state.repos, repo) })
    })
  }

  render() {
    return (
      <div>
        <a href={`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}`}>Login with github</a>
        <button onClick={this.fetchGithubRepos}>Add Repo</button>
          {
            this.state.repo_options.map((repo) => {
              return <div onClick={() => this.handleCreateRepo(repo.id, repo.fullName)} key={repo.id}>{repo.fullName}</div>
            })
          }
          {
            this.state.repos.map((repo) => {
              return <Repo key={repo.id} repo={repo} onDelete={() => this.handleDeleteRepo(repo)}></Repo>
            })
          }
      </div>
    )
  }
}

export default Home
