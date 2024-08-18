import styled, { keyframes } from "styled-components";
import {
    TransitionGroup,
  } from 'react-transition-group'


const scWidth =  270;

export const StyleTransitionGroup = styled(TransitionGroup)`
    left: ${props => props.left}px;
    bottom: ${props => props.bottom}px;
    max-height: ${props => props.maxheight}px;
    display: flex;
    flex-direction: column-reverse;
    flex-wrap: wrap;
    cursor: move !important;
    max-height: calc(100vh - 30px);
    position: fixed;
    z-index: 999;
    overflow: auto;
`;

export const ScTranstion = styled.div`
    &.sc-enter {
       opacity: 0;
    }
    &.sc-enter-active {
        opacity: 1;
        transition: opacity 500ms ease-in;
    }
    &.sc-exit {
        opacity: 1;
    }
    &.sc-exit-active {
        opacity: 0;
        transition: opacity 500ms ease-in;
    }
`

export const SC = styled.div`
    width: ${scWidth}px;
    border-radius: 6px;
    font-family: Arial, "Microsoft YaHei", "Microsoft Sans Serif", "Microsoft SanSerf", "微软雅黑";
    margin: 0 10px 4px 0;

    .top-container {
        box-sizing: border-box;
        padding: 8px 10px;
        height: 50px;
        display: flex;
        align-items: center;
        border-radius: 6px 6px 0 0;
        border-width: 1px;
        border-style: solid;

        .avatar-container {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;

            .avatar {
                width: 30px;
                height: 30px;
                border-radius: 17px;
                background-size: cover;
                background-position: center center;
                background-repeat: no-repeat;
            }

            .frame {
                width: 34px;
                height: 34px;
                position: absolute;
                top: -2px;
                left: -2px;
            }
        }

        .top-right-container {
            margin: 2px 0 0 6px;
            display: flex;
            flex-direction: column;
            color: #333;
            width: 100%;

            .name {
                opacity: 0.78;
                font-size: 12px;
            }

            .price {
                padding-top: 2px;
            }
        }
      }

        .content {
            border-radius: 2px 2px 6px 6px;
            padding: 8px 10px;
            min-height: 38px;
            line-height: 20px;
            word-break: break-word;
            color: #ffffff;
        }
`;

const clipAnimation = keyframes`
    0% {
        clip-path: inset(0px 0 0px 0px round 100px);
    }

    100% {
        clip-path: inset(0px 100% 0px 0px round 100px);
    }
`;

export const ProgressInner = styled.div`
    width: ${scWidth}px;
    position: relative;
    overflow: hidden;
    vertical-align: middle;
    border-radius: 100px;
    background-color: #fff;
    margin-bottom: 8px;

    .progress-bg {
        width: calc(100% - 10px);
        height: 4px;
        animation-name: ${clipAnimation} ;
        animation-timing-function: linear;
        animation-iteration-count: 1;
        animation-fill-mode: forwards;
    }
`